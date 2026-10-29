import { z } from "zod";
import { db, ilike } from "@repo/database";
import { locationsTable } from "@repo/database/schema";

const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        country: z.string().optional(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});
type Place = { id: number; name: string; lat: number; lng: number; region: string };
const cache = new Map<string, { at: number; places: Place[] }>();
export async function searchLocations(query: string) {
  const safe = query.replace(/[\\%_]/g, (char) => `\\${char}`);
  const destinations = await db
    .select()
    .from(locationsTable)
    .where(ilike(locationsTable.name, `%${safe}%`))
    .limit(8);
  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 3600000)
    return { destinations, places: cached.places, geocodingUnavailable: false };
  try {
    const params = new URLSearchParams({ name: query, count: "6", language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("City search unavailable");
    const data = geocodingSchema.parse(await response.json());
    const places = (data.results ?? []).map((place) => ({
      id: place.id,
      name: place.name,
      lat: place.latitude,
      lng: place.longitude,
      region: [place.admin1, place.country].filter(Boolean).join(", "),
    }));
    if (cache.size >= 50) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), places });
    return { destinations, places, geocodingUnavailable: false };
  } catch {
    return { destinations, places: [] as Place[], geocodingUnavailable: true };
  }
}
