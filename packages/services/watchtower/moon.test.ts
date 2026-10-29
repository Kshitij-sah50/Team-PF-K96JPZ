import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMoonDay } from "./moon-model";
import { moonriseMessage } from "../../../apps/web/lib/moon-reminders";
function payload() {
  return {
    properties: {
      data: {
        year: 2026,
        month: 10,
        day: 29,
        tz: 0,
        curphase: "Waning Gibbous",
        fracillum: "85%",
        moondata: [
          { phen: "Rise", time: "14:22" },
          { phen: "Set", time: "04:32" },
        ],
      },
    },
  };
}
test("moon data preserves UTC and parses phase and illumination", () => {
  const result = parseMoonDay(payload(), "2026-10-29");
  assert.equal(result.moonriseUtc?.toISOString(), "2026-10-29T14:22:00.000Z");
  assert.equal(result.illuminationPct, 85);
  assert.equal(result.phaseName, "Waning Gibbous");
});
test("missing polar rise/set stays null, malformed data is rejected", () => {
  const polar = payload();
  polar.properties.data.moondata = [];
  assert.equal(parseMoonDay(polar, "2026-10-29").moonriseUtc, null);
  assert.throws(() => parseMoonDay(payload(), "2026-10-30"));
  const invalid = payload();
  invalid.properties.data.fracillum = "140%";
  assert.throws(() => parseMoonDay(invalid, "2026-10-29"));
  const time = payload();
  time.properties.data.moondata[0]!.time = "24:99";
  assert.throws(() => parseMoonDay(time, "2026-10-29"));
});
test("moonrise alerts use the observer timezone and distinguish past/day/night", () => {
  const rise = new Date("2026-10-29T14:22:00Z"),
    now = new Date("2026-10-29T12:00:00Z");
  assert.match(moonriseMessage(rise, now, "Asia/Kolkata"), /tonight/);
  assert.match(moonriseMessage(rise, now, "UTC"), /today/);
  assert.match(moonriseMessage(rise, new Date("2026-10-29T15:00:00Z"), "Asia/Kolkata"), /rose/);
  const dst = moonriseMessage(
    new Date("2026-11-01T06:30:00Z"),
    new Date("2026-11-01T04:00:00Z"),
    "America/New_York",
  );
  assert.match(dst, /tonight/);
});
