import { z } from "zod";

export const cityQuery = z.string().trim().min(2).max(80);
const responseSchema = z.object({
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
export type CityPlace = { id: number; name: string; lat: number; lng: number; region: string };

// This adapter runs on the web host: city suggestions must not depend on the
// destination database or the API host's ability to reach the geocoder.
export async function findCities(
  query: string,
  fetcher: typeof fetch = fetch,
): Promise<CityPlace[]> {
  const name = cityQuery.parse(query);
  const params = new URLSearchParams({ name, count: "20", language: "en", format: "json" });
  const response = await fetcher(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`City provider returned HTTP ${response.status}`);
  const data = responseSchema.parse(await response.json());
  return (data.results ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    lat: place.latitude,
    lng: place.longitude,
    region: [place.admin1, place.country].filter(Boolean).join(", "),
  }));
}
