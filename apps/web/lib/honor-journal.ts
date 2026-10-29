import { z } from "zod";
const entrySchema = z.object({
  eventId: z.uuid(),
  title: z.string().min(1).max(300),
  observedAt: z.iso.datetime(),
  notes: z.string().max(500),
  points: z.literal(25),
});
export type HonorEntry = z.infer<typeof entrySchema>;
const key = "tsukuyomi-honor-v1";
export const HONOR_CHANGE = "tsukuyomi-honor-change";
export function readJournal(): HonorEntry[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const parsed = z.array(entrySchema).max(1000).safeParse(JSON.parse(raw));
  if (!parsed.success)
    throw new Error(
      "The saved journal could not be read. Export or recover your browser storage before adding entries.",
    );
  return Array.from(new Map(parsed.data.map((entry) => [entry.eventId, entry])).values());
}
export function appendObservation(
  entries: HonorEntry[],
  input: { eventId: string; title: string; startUtc: string; observedAt: string; notes: string },
  now = Date.now(),
): HonorEntry[] {
  const start = Date.parse(input.startUtc),
    observed = Date.parse(input.observedAt);
  if (!Number.isFinite(start) || !Number.isFinite(observed) || observed > now || observed < start)
    throw new Error(
      "Choose an observation time after the event begins and before the current time.",
    );
  if (entries.some((entry) => entry.eventId === input.eventId))
    throw new Error("This event is already recorded. Points are awarded once per event.");
  if (entries.length >= 1000)
    throw new Error("This device journal is full. Export it before starting a new journal.");
  const entry = entrySchema.parse({
    eventId: input.eventId,
    title: input.title,
    observedAt: new Date(observed).toISOString(),
    notes: input.notes.trim(),
    points: 25,
  });
  return [...entries, entry];
}
export async function recordObservation(input: Parameters<typeof appendObservation>[1]) {
  const save = () => {
    localStorage.setItem(key, JSON.stringify(appendObservation(readJournal(), input)));
    window.dispatchEvent(new Event(HONOR_CHANGE));
  };
  if (navigator.locks) await navigator.locks.request(key, save);
  else save();
}
export function honorSummary(entries: HonorEntry[]) {
  const points = entries.reduce((sum, entry) => sum + entry.points, 0);
  return {
    points,
    count: entries.length,
    badge:
      points >= 250
        ? "Ronin Watcher"
        : points >= 100
          ? "Night Guardian"
          : points >= 25
            ? "First Light"
            : "Wandering Observer",
  };
}
