import { parseMoonDay } from "./moon-model";
import { db, and, eq, gte } from "@repo/database";
import { locationsTable, moonRiseSetsTable } from "@repo/database/schema";

const inFlight = new Map<string, Promise<typeof moonRiseSetsTable.$inferSelect>>();
async function moonDay(location: typeof locationsTable.$inferSelect, date: string) {
  const key = `${location.id}:${date}`;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const request = (async () => {
    const [cached] = await db
      .select()
      .from(moonRiseSetsTable)
      .where(
        and(
          eq(moonRiseSetsTable.locationId, location.id),
          eq(moonRiseSetsTable.date, date),
          gte(moonRiseSetsTable.fetchedAt, new Date(Date.now() - 60 * 60 * 1000)),
        ),
      )
      .limit(1);
    if (cached?.phaseName && cached.illuminationPct !== null) return cached;
    const params = new URLSearchParams({
      date,
      coords: `${location.lat},${location.lng}`,
      tz: "0",
    });
    const response = await fetch(`https://aa.usno.navy.mil/api/rstt/oneday?${params}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Moon provider is unavailable");
    const values = parseMoonDay(await response.json(), date);
    const [saved] = await db
      .insert(moonRiseSetsTable)
      .values({ ...values, locationId: location.id, date })
      .onConflictDoUpdate({
        target: [moonRiseSetsTable.locationId, moonRiseSetsTable.date],
        set: { ...values, fetchedAt: new Date() },
      })
      .returning();
    if (!saved) throw new Error("Could not store moon conditions");
    return saved;
  })();
  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
}

export async function getMoonConditions(locationId: string) {
  const [location] = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.id, locationId))
    .limit(1);
  if (!location) return null;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  // Adjacent UTC days cover a local day in every timezone, including DST changes.
  const dates = [-1, 0, 1].map((offset) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset))
      .toISOString()
      .slice(0, 10),
  );
  const days = await Promise.all(dates.map((date) => moonDay(location, date)));
  const current = days.find((day) => day.date === today)!;
  return {
    phaseName: current.phaseName!,
    illuminationPct: current.illuminationPct!,
    asOfUtc: today,
    rises: days
      .flatMap((day) => (day.moonriseUtc ? [day.moonriseUtc] : []))
      .sort((a, b) => a.getTime() - b.getTime()),
    sets: days
      .flatMap((day) => (day.moonsetUtc ? [day.moonsetUtc] : []))
      .sort((a, b) => a.getTime() - b.getTime()),
    fetchedAt: current.fetchedAt,
  };
}
