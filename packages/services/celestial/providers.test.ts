import assert from "node:assert/strict";
import { test } from "node:test";
import { monthBounds, parseLaunches, parsePhases } from "./providers";
import { buildEventCalendar } from "../../../apps/web/lib/event-calendar";

test("UTC month boundaries handle December rollover and leap February", () => {
  assert.equal(monthBounds("2026-12").end.toISOString(), "2027-01-01T00:00:00.000Z");
  const leap = monthBounds("2028-02");
  assert.equal((leap.end.getTime() - leap.start.getTime()) / 86400000, 29);
  assert.throws(() => monthBounds("2026-13"));
});

test("moon phases preserve UTC instants, exclude other months, and reject impossible dates", () => {
  const result = parsePhases(
    {
      phasedata: [
        { year: 2026, month: 10, day: 26, time: "04:12", phase: "Full Moon" },
        { year: 2026, month: 11, day: 1, time: "20:28", phase: "Last Quarter" },
      ],
    },
    "2026-10",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0]?.startUtc.toISOString(), "2026-10-26T04:12:00.000Z");
  assert.equal(result[0]?.sourceApi, "USNO");
  assert.throws(() =>
    parsePhases(
      { phasedata: [{ year: 2026, month: 2, day: 30, time: "04:12", phase: "Full Moon" }] },
      "2026-02",
    ),
  );
  assert.throws(() => parsePhases({ error: "Unavailable" }, "2026-10"));
});

test("launches retain provider IDs for upserts, source status and pagination warning", () => {
  const result = parseLaunches(
    {
      next: "https://ll.thespacedevs.com/next",
      results: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Test launch",
          net: "2026-10-30T10:00:00Z",
          status: { name: "To Be Determined" },
          mission: null,
          pad: { name: "Test pad", location: { name: "Test range" } },
        },
      ],
    },
    "2026-10",
  );
  assert.equal(result.truncated, true);
  assert.equal(result.events[0]?.externalId, "00000000-0000-4000-8000-000000000001");
  assert.match(result.events[0]!.description, /To Be Determined/);
  assert.equal(result.events[0]?.visibilityRegion, "Test pad, Test range");
  assert.throws(() => parseLaunches({ next: null, results: [{ net: "invalid" }] }, "2026-10"));
});

test("calendar export uses UTC and escapes injection, punctuation, and Unicode line folding", () => {
  const result = buildEventCalendar(
    {
      id: "test",
      title: "Moon, phase; night",
      description: "Line one\r\nBEGIN:VEVENT\n" + "月".repeat(100),
      startUtc: "2026-10-30T10:00:00Z",
    },
    new Date("2026-10-29T10:00:00Z"),
  );
  assert.match(result, /DTSTART:20261030T100000Z/);
  assert.match(result, /TRIGGER:-PT30M/);
  assert.match(result, /SUMMARY:Moon\\, phase\\; night/);
  assert.equal(result.split("\r\n").filter((line) => line === "BEGIN:VEVENT").length, 1);
  assert.ok(result.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75));
  assert.throws(() =>
    buildEventCalendar({ id: "bad", title: "Bad", description: null, startUtc: "invalid" }),
  );
});
