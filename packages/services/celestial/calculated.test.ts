import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchEclipses, fetchMeteors } from "./calculated";
import { 旧暦計算 } from "himekuri/旧暦.js";
import { predictPasses, fullySunlit } from "./iss";
test("eclipse search returns the August 2026 total solar eclipse", async () => {
  const result = await fetchEclipses("2026-08");
  const solar = result.events.find((event) => event.title.includes("solar"));
  assert.ok(solar);
  assert.equal(solar.startUtc.toISOString().slice(0, 10), "2026-08-12");
  assert.match(solar.title, /total/);
});
test("meteor catalogue exposes estimates and limits them to requested month", async () => {
  const result = await fetchMeteors("2026-12");
  assert.equal(result.events.length, 2);
  assert.ok(result.events.every((event) => event.description.includes("placeholder")));
});
test("Japanese lunisolar calendar handles new year and leap sixth month", () => {
  const first = 旧暦計算([2026, 2, 17]);
  assert.equal(first.月, 1);
  assert.equal(first.日, 1);
  const leap = 旧暦計算([2025, 7, 25]);
  assert.equal(leap.月, 6);
  assert.equal(leap.日, 1);
  assert.equal(leap.閏, true);
});
test("ISS rejects invalid orbital data instead of synthesizing passes", () => {
  assert.throws(() => predictPasses("invalid", 31, 77), /Invalid ISS/);
});
test("ISS illumination and propagation produce bounded future segments", () => {
  assert.equal(fullySunlit({ x: 1, y: 0, z: 0 }, { x: 6778, y: 0, z: 0 }), true);
  assert.equal(fullySunlit({ x: 1, y: 0, z: 0 }, { x: -6778, y: 0, z: 0 }), false);
  const tle =
    "ISS\n1 25544U 98067A   26302.17661613  .00005622  00000+0  10975-3 0  9993\n2 25544  51.6334 357.0447 0007004 322.8383  37.2120 15.49096712592526";
  const now = new Date("2026-10-29T12:00:00Z"),
    result = predictPasses(tle, 32.779, 78.964, now);
  for (const pass of result.passes) {
    assert.ok(pass.maxElevation >= 10 && pass.maxElevation <= 90);
    assert.ok(Date.parse(pass.start) >= now.getTime());
    assert.ok(Date.parse(pass.end) > Date.parse(pass.start));
  }
  assert.throws(() => predictPasses(tle, 32, 78, new Date("2026-11-10")), /stale/);
});
