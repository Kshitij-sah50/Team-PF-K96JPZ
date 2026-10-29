import { z } from "zod";

export type NormalizedEvent = {
  title: string;
  description: string;
  startUtc: Date;
  sourceApi: string;
  externalId: string;
  url: string;
  visibilityRegion: string | null;
};
const utcDate = z.iso.datetime({ offset: true });
const phasesSchema = z.object({
  phasedata: z.array(
    z.object({
      year: z.number().int().min(1700).max(2100),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      phase: z.enum(["New Moon", "First Quarter", "Full Moon", "Last Quarter"]),
    }),
  ),
});
const launchesSchema = z.object({
  next: z.string().nullable(),
  results: z.array(
    z.object({
      id: z.uuid(),
      name: z.string().min(1),
      net: utcDate,
      status: z.object({ name: z.string() }),
      mission: z.object({ description: z.string().nullable() }).nullable().optional(),
      pad: z
        .object({ name: z.string(), location: z.object({ name: z.string() }) })
        .nullable()
        .optional(),
    }),
  ),
});

export function monthBounds(month: string) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
  const start = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export function parsePhases(payload: unknown, month: string): NormalizedEvent[] {
  const { start, end } = monthBounds(month);
  return phasesSchema
    .parse(payload)
    .phasedata.map((phase) => {
      const day = `${phase.year}-${String(phase.month).padStart(2, "0")}-${String(phase.day).padStart(2, "0")}`;
      const date = new Date(`${day}T${phase.time}:00Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day)
        throw new Error("Invalid phase date");
      return {
        title: phase.phase,
        description:
          "Primary lunar phase instant, in UTC. Moonrise and local visibility depend on your observing location.",
        startUtc: date,
        sourceApi: "USNO",
        externalId: `${day}:${phase.phase}`,
        url: "https://aa.usno.navy.mil/data/MoonPhases",
        visibilityRegion: null,
      };
    })
    .filter((event) => event.startUtc >= start && event.startUtc < end);
}

export function parseLaunches(payload: unknown, month: string) {
  const { start, end } = monthBounds(month);
  const data = launchesSchema.parse(payload);
  return {
    truncated: data.next !== null,
    events: data.results
      .map((launch) => ({
        title: launch.name,
        description:
          `Schedule status: ${launch.status.name}. Launch times are provisional. ${launch.mission?.description ?? ""}`.trim(),
        startUtc: new Date(launch.net),
        sourceApi: "LAUNCH_LIBRARY",
        externalId: launch.id,
        url: `https://ll.thespacedevs.com/2.3.0/launches/${launch.id}/`,
        visibilityRegion: launch.pad ? `${launch.pad.name}, ${launch.pad.location.name}` : null,
      }))
      .filter((event) => event.startUtc >= start && event.startUtc < end),
  };
}

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Event provider returned ${response.status}`);
  return response.json();
}

export async function fetchPhases(month: string) {
  monthBounds(month);
  const data = await getJson(
    `https://aa.usno.navy.mil/api/moon/phases/date?date=${month}-01&nump=8`,
  );
  return { events: parsePhases(data, month), truncated: false };
}

export async function fetchLaunches(month: string) {
  const { start, end } = monthBounds(month);
  const params = new URLSearchParams({
    net__gte: start.toISOString(),
    net__lt: end.toISOString(),
    ordering: "net",
    limit: "100",
    mode: "normal",
  });
  // One bounded request: never follow provider-supplied URLs. Report truncation.
  return parseLaunches(
    await getJson(`https://ll.thespacedevs.com/2.3.0/launches/?${params}`),
    month,
  );
}
