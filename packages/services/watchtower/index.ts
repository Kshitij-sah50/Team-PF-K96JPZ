import { db, and, desc, eq, gte } from "@repo/database";
import { locationsTable, weatherSnapshotsTable, nightScoresTable } from "@repo/database/schema";
import { calculateNightScore, distanceKm, fetchNightForecast } from "./weather";

export async function listLocations(origin?: { lat: number; lng: number; radiusKm: number }) {
  const rows = await db.select().from(locationsTable).orderBy(locationsTable.name).limit(500);
  return rows
    .map((location) => ({
      ...location,
      distanceKm: origin ? distanceKm(origin.lat, origin.lng, location.lat, location.lng) : null,
    }))
    .filter((location) => !origin || location.distanceKm! <= origin.radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

const inFlight = new Map<string, Promise<Awaited<ReturnType<typeof loadConditions>>>>();

async function loadConditions(locationId: string) {
  const [location] = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.id, locationId))
    .limit(1);
  if (!location) return null;
  const now = new Date();
  const [cached] = await db
    .select({ weather: weatherSnapshotsTable, score: nightScoresTable })
    .from(weatherSnapshotsTable)
    .innerJoin(nightScoresTable, eq(nightScoresTable.snapshotId, weatherSnapshotsTable.id))
    .where(
      and(
        eq(weatherSnapshotsTable.locationId, locationId),
        gte(weatherSnapshotsTable.fetchedAt, new Date(now.getTime() - 30 * 60 * 1000)),
        gte(weatherSnapshotsTable.forecastFor, now),
      ),
    )
    .orderBy(desc(weatherSnapshotsTable.fetchedAt))
    .limit(1);
  if (cached) return { ...cached, cached: true };
  const forecast = await fetchNightForecast(location.lat, location.lng);
  const components = calculateNightScore(forecast);
  return db.transaction(async (transaction) => {
    const [weather] = await transaction
      .insert(weatherSnapshotsTable)
      .values({ ...forecast, locationId })
      .returning();
    if (!weather) throw new Error("Could not store weather");
    const [score] = await transaction
      .insert(nightScoresTable)
      .values({ ...components, snapshotId: weather.id })
      .returning();
    if (!score) throw new Error("Could not store score");
    return { weather, score, cached: false };
  });
}

export async function getConditions(locationId: string) {
  const existing = inFlight.get(locationId);
  if (existing) return existing;
  const request = loadConditions(locationId);
  inFlight.set(locationId, request);
  try {
    return await request;
  } finally {
    inFlight.delete(locationId);
  }
}
