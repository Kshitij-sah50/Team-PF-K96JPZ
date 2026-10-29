import { db, eq } from "@repo/database";
import { locationsTable } from "@repo/database/schema";
import { get } from "node:https";
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
  ecfToLookAngles,
  degreesToRadians,
  radiansToDegrees,
  jday,
  sunPos,
} from "satellite.js";
export function fullySunlit(
  sun: { x: number; y: number; z: number },
  position: { x: number; y: number; z: number },
) {
  const toSun = {
    x: sun.x * 149597870.7 - position.x,
    y: sun.y * 149597870.7 - position.y,
    z: sun.z * 149597870.7 - position.z,
  };
  const earthDistance = Math.hypot(position.x, position.y, position.z),
    sunDistance = Math.hypot(toSun.x, toSun.y, toSun.z);
  const separation = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        -(position.x * toSun.x + position.y * toSun.y + position.z * toSun.z) /
          (earthDistance * sunDistance),
      ),
    ),
  );
  return separation > Math.asin(6378.137 / earthDistance) + Math.asin(695700 / sunDistance);
}
let cached: { text: string; expires: number } | undefined;
let active: Promise<string> | undefined;
async function elements() {
  if (cached && cached.expires > Date.now()) return cached.text;
  if (active) return active;
  active = new Promise<string>((resolve, reject) => {
    const request = get(
      "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE",
      { family: 4, headers: { "User-Agent": "TsukuyomiWatch/1.0", Accept: "text/plain" } },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error("Orbital data is unavailable."));
          return;
        }
        let text = "";
        response.on("data", (chunk) => {
          text += String(chunk);
          if (text.length > 10000) response.destroy(new Error("Invalid orbital response."));
        });
        response.on("error", reject);
        response.on("end", () => resolve(text));
      },
    );
    const timer = setTimeout(
      () => request.destroy(new Error("Orbital provider timed out.")),
      25000,
    );
    request.on("error", reject);
    request.on("close", () => clearTimeout(timer));
  });
  try {
    const text = await active;
    cached = { text, expires: Date.now() + 3600000 };
    return text;
  } finally {
    active = undefined;
  }
}
export function predictPasses(text: string, lat: number, lng: number, now = new Date()) {
  const lines = text.trim().split(/\r?\n/);
  const first = lines.find((line) => line.startsWith("1 25544")),
    second = lines.find((line) => line.startsWith("2 25544"));
  if (!first || !second) throw new Error("Invalid ISS orbital elements.");
  const sat = twoline2satrec(first, second);
  const epoch = (sat.jdsatepoch - 2440587.5) * 86400000;
  if (Math.abs(now.getTime() - epoch) > 3 * 86400000)
    throw new Error("ISS orbital elements are stale. Retry when fresh data is available.");
  const observer = { latitude: degreesToRadians(lat), longitude: degreesToRadians(lng), height: 0 };
  const passes: { start: string; end: string; peak: string; maxElevation: number }[] = [];
  let current: (typeof passes)[number] | undefined;
  for (let ms = now.getTime(); ms < now.getTime() + 3 * 86400000; ms += 20000) {
    const date = new Date(ms),
      position = propagate(sat, date)?.position;
    if (!position) continue;
    const angle = gstime(date);
    const look = ecfToLookAngles(observer, eciToEcf(position, angle));
    const solar = sunPos(jday(date)).rsun;
    const sun = { x: solar[0]!, y: solar[1]!, z: solar[2]! };
    const sunLook = ecfToLookAngles(
      observer,
      eciToEcf({ x: sun.x * 149597870.7, y: sun.y * 149597870.7, z: sun.z * 149597870.7 }, angle),
    );
    const elevation = radiansToDegrees(look.elevation);
    const visible =
      elevation >= 10 && radiansToDegrees(sunLook.elevation) < -6 && fullySunlit(sun, position);
    if (visible) {
      if (!current)
        current = {
          start: date.toISOString(),
          end: date.toISOString(),
          peak: date.toISOString(),
          maxElevation: elevation,
        };
      current.end = date.toISOString();
      if (elevation > current.maxElevation) {
        current.maxElevation = elevation;
        current.peak = date.toISOString();
      }
    } else if (current) {
      if (Date.parse(current.end) - Date.parse(current.start) >= 20000) passes.push(current);
      current = undefined;
    }
  }
  if (current && Date.parse(current.end) - Date.parse(current.start) >= 20000) passes.push(current);
  return {
    passes: passes.slice(0, 20),
    epoch: new Date(epoch).toISOString(),
    computedAt: now.toISOString(),
  };
}
export async function issPasses(locationId: string) {
  const [location] = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.id, locationId))
    .limit(1);
  if (!location) throw new Error("Location not found.");
  return {
    ...predictPasses(await elements(), location.lat, location.lng),
    locationName: location.name,
  };
}
