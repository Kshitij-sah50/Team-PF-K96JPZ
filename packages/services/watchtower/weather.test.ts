import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateNightScore, distanceKm, parseNightForecast } from "./weather";

test("score bounds, weighted components, and visibility cap", () => {
  assert.equal(
    calculateNightScore({ cloudCoverPct: 0, humidityPct: 0, visibilityKm: 20 }).score,
    100,
  );
  assert.equal(
    calculateNightScore({ cloudCoverPct: 100, humidityPct: 100, visibilityKm: 0 }).score,
    0,
  );
  const average = calculateNightScore({ cloudCoverPct: 50, humidityPct: 50, visibilityKm: 10 });
  assert.equal(average.score, 50);
  assert.equal(
    average.cloudComponent + average.visibilityComponent + average.humidityComponent,
    37.5,
  );
  assert.equal(
    calculateNightScore({ cloudCoverPct: 0, humidityPct: 0, visibilityKm: 100 }).score,
    100,
  );
  assert.throws(() => calculateNightScore({ cloudCoverPct: -1, humidityPct: 0, visibilityKm: 20 }));
});

const now = new Date("2026-10-29T12:30:00Z");
function payload() {
  return {
    hourly: {
      time: ["2026-10-29T12:00:00Z", "2026-10-29T13:00:00Z", "2026-10-29T14:00:00Z"].map(
        (time) => Date.parse(time) / 1000,
      ),
      is_day: [0, 1, 0],
      cloud_cover: [10, 20, 30],
      relative_humidity_2m: [40, 50, 60],
      visibility: [10000, 20000, 30000],
      temperature_2m: [10, 11, 12],
      wind_speed_10m: [5, 6, 7],
    },
  };
}

test("chooses the next future nighttime hour and converts metres to km", () => {
  const result = parseNightForecast(payload(), now);
  assert.equal(result.forecastFor.toISOString(), "2026-10-29T14:00:00.000Z");
  assert.equal(result.visibilityKm, 30);
  assert.equal(result.cloudCoverPct, 30);
});
test("rejects malformed, missing, and daytime-only forecast responses", () => {
  assert.throws(() => parseNightForecast({}, now));
  const incomplete = payload();
  incomplete.hourly.visibility.pop();
  assert.throws(() => parseNightForecast(incomplete, now));
  const daytime = payload();
  daytime.hourly.is_day = [1, 1, 1];
  assert.throws(() => parseNightForecast(daytime, now));
  const missing = payload();
  assert.throws(() =>
    parseNightForecast({ hourly: { ...missing.hourly, visibility: [10000, 20000, null] } }, now),
  );
});
test("distance handles identical coordinates, known arc, and date-line crossing", () => {
  assert.equal(distanceKm(32, 78, 32, 78), 0);
  assert.ok(Math.abs(distanceKm(0, 0, 0, 1) - 111.195) < 0.01);
  assert.ok(distanceKm(0, 179.9, 0, -179.9) < 23);
});
