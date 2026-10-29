export type MoonReminder = {
  id: string;
  locationName: string;
  riseAt: string;
  alertAt: string;
  timeZone: string;
  sent: boolean;
};
export const reminderEvent = "tsukuyomi-reminders-change";
const key = "tsukuyomi-moon-reminders";
export function readReminders(): MoonReminder[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (item): item is MoonReminder =>
          !!item &&
          typeof item.id === "string" &&
          typeof item.locationName === "string" &&
          typeof item.timeZone === "string" &&
          typeof item.sent === "boolean" &&
          typeof item.riseAt === "string" &&
          typeof item.alertAt === "string" &&
          Number.isFinite(Date.parse(item.riseAt)) &&
          Number.isFinite(Date.parse(item.alertAt)) &&
          Date.parse(item.riseAt) > Date.now() - 86400000,
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}
export function saveReminders(items: MoonReminder[]) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(reminderEvent));
}
export function moonriseMessage(rise: Date, now: Date, timeZone: string) {
  const date = (value: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  const time = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(rise);
  if (rise <= now) return `The Moon rose at ${time}.`;
  if (date(rise) === date(now)) {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(
        rise,
      ),
    );
    return `The Moon rises ${hour >= 18 || hour < 5 ? "tonight" : "today"} at ${time}.`;
  }
  const day = new Intl.DateTimeFormat(undefined, {
    timeZone,
    month: "short",
    day: "numeric",
  }).format(rise);
  return `The Moon rises on ${day} at ${time}.`;
}
