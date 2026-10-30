import { NextRequest } from "next/server";
import { cityQuery, findCities, type CityPlace } from "~/lib/geocoding";

export const runtime = "nodejs";
const cache = new Map<string, { places: CityPlace[]; expires: number }>();
const pending = new Map<string, Promise<CityPlace[]>>();

export async function GET(request: NextRequest) {
  const input = cityQuery.safeParse(request.nextUrl.searchParams.get("query"));
  if (!input.success)
    return Response.json({ error: "Enter a city name with 2–80 characters." }, { status: 400 });
  const key = input.data.toLowerCase();
  try {
    let result = cache.get(key);
    if (!result || result.expires <= Date.now()) {
      let job = pending.get(key);
      if (!job) {
        if (pending.size >= 10)
          return Response.json(
            { error: "City search is busy. Please try again." },
            { status: 429 },
          );
        job = findCities(input.data);
        pending.set(key, job);
        void job.finally(() => pending.delete(key)).catch(() => {});
      }
      const places = await job;
      if (cache.size >= 50) cache.delete(cache.keys().next().value!);
      result = { places, expires: Date.now() + 3600000 };
      cache.set(key, result);
    }
    return Response.json(
      { places: result.places },
      {
        headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
      },
    );
  } catch (error) {
    console.warn(
      "City geocoding failed",
      error instanceof Error ? error.message : "Unknown provider failure",
    );
    return Response.json(
      { error: "City search is temporarily unavailable. Please try again." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
