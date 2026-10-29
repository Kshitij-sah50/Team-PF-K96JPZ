import { z } from "zod";

const percentage = z.number().min(0).max(100);
const weatherSchema = z.object({
  hourly: z.object({
    time: z.array(z.number().int().positive()),
    cloud_cover: z.array(percentage.nullable()),
    relative_humidity_2m: z.array(percentage.nullable()),
    visibility: z.array(z.number().nonnegative().nullable()),
    temperature_2m: z.array(z.number().nullable()),
    wind_speed_10m: z.array(z.number().nonnegative().nullable()),
    is_day: z.array(z.union([z.literal(0), z.literal(1)])),
  }),
});

export type Forecast = {
  forecastFor: Date;
  cloudCoverPct: number;
  humidityPct: number;
  visibilityKm: number;
  temperatureC: number | null;
  windKph: number | null;
};

// Weather-only score: normalize the document's 40/20/15 weights to 100.
// Visibility reaches full credit at 20 km. Moonlight and darkness are excluded.
export function calculateNightScore(
  weather: Pick<Forecast, "cloudCoverPct" | "humidityPct" | "visibilityKm">,
) {
  const cloud = percentage.parse(weather.cloudCoverPct);
  const humidity = percentage.parse(weather.humidityPct);
  const visibility = z.number().nonnegative().parse(weather.visibilityKm);
  const cloudComponent = 40 * (1 - cloud / 100);
  const visibilityComponent = 20 * Math.min(visibility / 20, 1);
  const humidityComponent = 15 * (1 - humidity / 100);
  return {
    score: Math.round(((cloudComponent + visibilityComponent + humidityComponent) / 75) * 100),
    cloudComponent,
    visibilityComponent,
    humidityComponent,
    lightPollutionComponent: 0,
    moonIlluminationComponent: 0,
  };
}

export function parseNightForecast(payload: unknown, now = new Date()): Forecast {
  const { hourly } = weatherSchema.parse(payload);
  const arrays = Object.values(hourly);
  if (arrays.some((values) => values.length !== hourly.time.length))
    throw new Error("Incomplete forecast response");
  // Select the next nighttime hour, never a past hour or daytime estimate.
  const index = hourly.time.findIndex(
    (time, i) => time * 1000 >= now.getTime() && hourly.is_day[i] === 0,
  );
  if (index < 0) throw new Error("No nighttime forecast available");
  const cloudCoverPct = hourly.cloud_cover[index];
  const humidityPct = hourly.relative_humidity_2m[index];
  const visibilityM = hourly.visibility[index];
  const time = hourly.time[index];
  if (cloudCoverPct == null || humidityPct == null || visibilityM == null || time == null)
    throw new Error("Nighttime weather data is missing");
  return {
    forecastFor: new Date(time * 1000),
    cloudCoverPct,
    humidityPct,
    visibilityKm: visibilityM / 1000,
    temperatureC: hourly.temperature_2m[index] ?? null,
    windKph: hourly.wind_speed_10m[index] ?? null,
  };
}

export async function fetchNightForecast(lat: number, lng: number): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: "cloud_cover,relative_humidity_2m,visibility,temperature_2m,wind_speed_10m,is_day",
    forecast_days: "3",
    timeformat: "unixtime",
    timezone: "GMT",
    wind_speed_unit: "kmh",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
  return parseNightForecast(await response.json());
}

export function distanceKm(lat: number, lng: number, targetLat: number, targetLng: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const a =
    Math.sin(radians(targetLat - lat) / 2) ** 2 +
    Math.cos(radians(lat)) *
      Math.cos(radians(targetLat)) *
      Math.sin(radians(targetLng - lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}
