import { db, and, asc, desc, eq, gte, lt, inArray } from "@repo/database";
import {
  celestialEventsTable,
  eventTypesTable,
  eventFeedSyncTable,
  eventFeedItemsTable,
} from "@repo/database/schema";
import { fetchLaunches, fetchPhases, monthBounds, type NormalizedEvent } from "./providers";
import { fetchEclipses, fetchMeteors } from "./calculated";
import { 旧暦計算 as kyureki } from "himekuri/旧暦.js";

export async function getCelestialEvent(id: string) {
  const [result] = await db
    .select({
      event: celestialEventsTable,
      type: eventTypesTable.code,
      label: eventTypesTable.label,
      syncedAt: eventFeedSyncTable.succeededAt,
    })
    .from(celestialEventsTable)
    .innerJoin(eventTypesTable, eq(eventTypesTable.id, celestialEventsTable.typeId))
    .leftJoin(eventFeedItemsTable, eq(eventFeedItemsTable.eventId, celestialEventsTable.id))
    .leftJoin(eventFeedSyncTable, eq(eventFeedSyncTable.key, eventFeedItemsTable.feedKey))
    .where(eq(celestialEventsTable.id, id))
    .orderBy(desc(eventFeedSyncTable.succeededAt))
    .limit(1);
  return result ?? null;
}

const providers = [
  {
    source: "ASTRONOMY_ENGINE",
    code: "ECLIPSE" as const,
    label: "Eclipse",
    icon: "eclipse",
    fetch: fetchEclipses,
  },
  {
    source: "IMO_SEASONAL",
    code: "METEOR" as const,
    label: "Meteor shower",
    icon: "sparkles",
    fetch: fetchMeteors,
  },
  {
    source: "USNO",
    code: "MOON_PHASE" as const,
    label: "Moon phase",
    icon: "moon",
    fetch: fetchPhases,
  },
  {
    source: "LAUNCH_LIBRARY",
    code: "LAUNCH" as const,
    label: "Rocket launch",
    icon: "rocket",
    fetch: fetchLaunches,
  },
];
const active = new Map<string, Promise<void>>();

async function syncFeed(provider: (typeof providers)[number], month: string) {
  const key = `${provider.source}:${month}`;
  const existing = active.get(key);
  if (existing) return existing;
  const request = (async () => {
    const [sync] = await db
      .select()
      .from(eventFeedSyncTable)
      .where(eq(eventFeedSyncTable.key, key))
      .limit(1);
    // Successes cached one hour, failures cooled down ten minutes. Refresh never bypasses this.
    const cooldown = sync?.failed ? 10 * 60 * 1000 : 60 * 60 * 1000;
    if (sync && Date.now() - sync.attemptedAt.getTime() < cooldown) return;
    const attemptedAt = new Date();
    let result: { events: NormalizedEvent[]; truncated: boolean };
    try {
      result = await provider.fetch(month);
    } catch {
      await db
        .insert(eventFeedSyncTable)
        .values({ key, attemptedAt, failed: true })
        .onConflictDoUpdate({ target: eventFeedSyncTable.key, set: { attemptedAt, failed: true } });
      return;
    }
    await db.transaction(async (transaction) => {
      await transaction
        .insert(eventFeedSyncTable)
        .values({
          key,
          attemptedAt,
          succeededAt: new Date(),
          failed: false,
          truncated: result.truncated,
        })
        .onConflictDoUpdate({
          target: eventFeedSyncTable.key,
          set: { attemptedAt, succeededAt: new Date(), failed: false, truncated: result.truncated },
        });
      await transaction.delete(eventFeedItemsTable).where(eq(eventFeedItemsTable.feedKey, key));
      const [type] = await transaction
        .insert(eventTypesTable)
        .values({ code: provider.code, label: provider.label, icon: provider.icon })
        .onConflictDoUpdate({ target: eventTypesTable.code, set: { label: provider.label } })
        .returning();
      if (!type) throw new Error("Could not store event type");
      for (const event of result.events) {
        const [stored] = await transaction
          .insert(celestialEventsTable)
          .values({ ...event, typeId: type.id })
          .onConflictDoUpdate({
            target: [celestialEventsTable.sourceApi, celestialEventsTable.externalId],
            set: {
              title: event.title,
              description: event.description,
              startUtc: event.startUtc,
              visibilityRegion: event.visibilityRegion,
              url: event.url,
            },
          })
          .returning({ id: celestialEventsTable.id });
        if (!stored) throw new Error("Could not store celestial event");
        await transaction
          .insert(eventFeedItemsTable)
          .values({ feedKey: key, eventId: stored.id })
          .onConflictDoNothing();
      }
    });
  })();
  active.set(key, request);
  try {
    await request;
  } finally {
    active.delete(key);
  }
}

export async function listCelestialEvents(
  month: string,
  type?: "MOON_PHASE" | "LAUNCH" | "ECLIPSE" | "METEOR",
) {
  const { start, end } = monthBounds(month);
  await Promise.all(providers.map((provider) => syncFeed(provider, month)));
  const events = await db
    .select({
      event: celestialEventsTable,
      type: eventTypesTable.code,
      label: eventTypesTable.label,
    })
    .from(celestialEventsTable)
    .innerJoin(eventTypesTable, eq(celestialEventsTable.typeId, eventTypesTable.id))
    .innerJoin(eventFeedItemsTable, eq(eventFeedItemsTable.eventId, celestialEventsTable.id))
    .where(
      and(
        inArray(
          eventFeedItemsTable.feedKey,
          providers.map((provider) => `${provider.source}:${month}`),
        ),
        gte(celestialEventsTable.startUtc, start),
        lt(celestialEventsTable.startUtc, end),
        type ? eq(eventTypesTable.code, type) : undefined,
      ),
    )
    .orderBy(asc(celestialEventsTable.startUtc))
    .limit(150);
  const feeds = await Promise.all(
    providers.map(async (provider) => {
      const [sync] = await db
        .select()
        .from(eventFeedSyncTable)
        .where(eq(eventFeedSyncTable.key, `${provider.source}:${month}`))
        .limit(1);
      return {
        source: provider.source,
        label: provider.label,
        failed: sync?.failed ?? true,
        succeededAt: sync?.succeededAt ?? null,
        truncated: sync?.truncated ?? false,
      };
    }),
  );
  const dayCount = new Date(end.getTime() - 86400000).getUTCDate();
  const lunarDays = Array.from({ length: dayCount }, (_, index) => {
    const date = kyureki([start.getUTCFullYear(), start.getUTCMonth() + 1, index + 1]);
    return { day: index + 1, year: date.年, month: date.月, lunarDay: date.日, leap: date.閏 };
  });
  return {
    events,
    feeds,
    lunarDays,
    calendar: null as null | {
      start: string;
      end: string;
      count: number;
      year: number;
      month: number;
      leap: boolean;
      previous: string;
    },
  };
}

export async function listLunarEvents(
  anchor: string,
  type?: "MOON_PHASE" | "LAUNCH" | "ECLIPSE" | "METEOR",
) {
  const date = new Date(`${anchor}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== anchor)
    throw new Error("Invalid lunar calendar anchor.");
  const lunar = kyureki([date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]);
  const start = new Date(date.getTime() - (lunar.日 - 1) * 86400000);
  let count = 29;
  for (; count <= 30; count++) {
    const next = new Date(start.getTime() + count * 86400000),
      value = kyureki([next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()]);
    if (value.日 === 1) break;
  }
  if (count > 30) throw new Error("Unsupported lunar month.");
  const end = new Date(start.getTime() + count * 86400000);
  const months = Array.from(
    new Set([
      start.toISOString().slice(0, 7),
      new Date(end.getTime() - 86400000).toISOString().slice(0, 7),
    ]),
  );
  const results = await Promise.all(months.map((month) => listCelestialEvents(month, type)));
  const events = Array.from(
    new Map(
      results
        .flatMap((result) => result.events)
        .filter(({ event }) => event.startUtc >= start && event.startUtc < end)
        .map((event) => [event.event.id, event]),
    ).values(),
  ).sort((a, b) => a.event.startUtc.getTime() - b.event.startUtc.getTime());
  const feeds = results[0]!.feeds.map((feed) => ({
    ...feed,
    failed: results.some(
      (result) => result.feeds.find((item) => item.source === feed.source)?.failed,
    ),
  }));
  const lunarDays = Array.from({ length: count }, (_, index) => ({
    day: index + 1,
    year: lunar.年,
    month: lunar.月,
    lunarDay: index + 1,
    leap: lunar.閏,
  }));
  return {
    events,
    feeds,
    lunarDays,
    calendar: {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      count,
      year: lunar.年,
      month: lunar.月,
      leap: lunar.閏,
      previous: new Date(start.getTime() - 86400000).toISOString().slice(0, 10),
    },
  };
}
