import { db, and, asc, eq, gte, lt, inArray } from "@repo/database";
import {
  celestialEventsTable,
  eventTypesTable,
  eventFeedSyncTable,
  eventFeedItemsTable,
} from "@repo/database/schema";
import { fetchLaunches, fetchPhases, monthBounds, type NormalizedEvent } from "./providers";

const providers = [
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

export async function listCelestialEvents(month: string, type?: "MOON_PHASE" | "LAUNCH") {
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
  return { events, feeds };
}
