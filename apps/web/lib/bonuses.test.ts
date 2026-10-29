import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeSamples, parseSamples } from "./transient-analysis";
import { appendObservation, honorSummary } from "./honor-journal";
test("signal analysis isolates an injected brightening and handles zero scatter", () => {
  const points = Array.from({ length: 30 }, (_, x) => ({
    x,
    flux: x === 20 ? 140 : 100,
    error: 2,
  }));
  const result = analyzeSamples(points, "time", 5);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0]!.x, 20);
  const flat = analyzeSamples(
    points.map((p) => ({ ...p, flux: 100, error: 0 })),
    "time",
  );
  assert.equal(flat.candidates.length, 0);
  assert.equal(flat.insufficientNoise, true);
});
test("spectrum flags positive and negative features", () => {
  const points = Array.from({ length: 40 }, (_, x) => ({
    x: 400 + x,
    flux: x === 15 ? 130 : x === 28 ? 70 : 100,
    error: 2,
  }));
  const result = analyzeSamples(points, "spectrum");
  assert.equal(result.candidates.length, 2);
  assert.ok(result.candidates.some((p) => p.score! < 0));
});
test("CSV rejects duplicate epochs, missing values, and ambiguous timezones", () => {
  const rows = Array.from(
    { length: 12 },
    (_, i) => `2026-01-01T00:${String(i).padStart(2, "0")}:00Z,100,2`,
  );
  assert.equal(parseSamples(`time_utc,flux,error\n${rows.join("\n")}`, "time").length, 12);
  assert.throws(
    () =>
      parseSamples(`time_utc,flux,error\n${[...rows.slice(0, 11), rows[0]].join("\n")}`, "time"),
    /Duplicate/,
  );
  assert.throws(
    () => parseSamples(`time_utc,flux,error\n${rows.join("\n").replaceAll("Z", "")}`, "time"),
    /timezone/,
  );
});
test("Honor awards once per event, rejects future/pre-event observations, and derives badges", () => {
  const input = {
    eventId: "10000000-0000-4000-8000-000000000001",
    title: "Observed moon",
    startUtc: "2026-01-01T00:00:00Z",
    observedAt: "2026-01-01T01:00:00Z",
    notes: "Clear sky",
  };
  const now = Date.parse("2026-01-02T00:00:00Z");
  const entries = appendObservation([], input, now);
  assert.equal(honorSummary(entries).points, 25);
  assert.equal(honorSummary(entries).badge, "First Light");
  assert.throws(() => appendObservation(entries, input, now), /already recorded/);
  assert.throws(
    () => appendObservation([], { ...input, observedAt: "2026-02-01T00:00:00Z" }, now),
    /observation time/,
  );
  assert.throws(
    () => appendObservation([], { ...input, observedAt: "2025-12-01T00:00:00Z" }, now),
    /observation time/,
  );
});
