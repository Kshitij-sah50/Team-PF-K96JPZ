import { z } from "zod";

const payloadSchema = z.object({
  properties: z.object({
    data: z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      tz: z.literal(0),
      curphase: z.string().min(1),
      fracillum: z.string().regex(/^\d+(?:\.\d+)?%$/),
      moondata: z.array(z.object({ phen: z.string(), time: z.string() })),
    }),
  }),
});

export function parseMoonDay(payload: unknown, date: string) {
  const data = payloadSchema.parse(payload).properties.data;
  const responseDate = `${data.year}-${String(data.month).padStart(2, "0")}-${String(data.day).padStart(2, "0")}`;
  if (responseDate !== date) throw new Error("Moon response date mismatch");
  const illuminationPct = Number(data.fracillum.replace("%", ""));
  if (illuminationPct < 0 || illuminationPct > 100) throw new Error("Invalid moon illumination");
  const getTime = (phen: string) => {
    const item = data.moondata.find((item) => item.phen === phen);
    // USNO may report no rise/set (circumpolar moon). Do not invent a time.
    if (!item) return null;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) throw new Error("Invalid moon event time");
    return new Date(`${date}T${item.time}:00Z`);
  };
  return {
    phaseName: data.curphase,
    illuminationPct,
    moonriseUtc: getTime("Rise"),
    moonsetUtc: getTime("Set"),
  };
}
