function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function downloadEventCalendar(event: Parameters<typeof buildEventCalendar>[0]) {
  const url = URL.createObjectURL(
    new Blob([buildEventCalendar(event)], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `tsukuyomi-${event.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function stamp(value: Date) {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}
function fold(line: string) {
  const lines: string[] = [];
  let part = "";
  let bytes = 0;
  for (const character of line) {
    const size = new TextEncoder().encode(character).length;
    if (bytes + size > 75) {
      lines.push(part);
      part = " ";
      bytes = 1;
    }
    part += character;
    bytes += size;
  }
  return [...lines, part].join("\r\n");
}
export function buildEventCalendar(
  event: {
    id: string;
    title: string;
    description: string | null;
    startUtc: string | Date;
    endUtc?: string | Date | null;
  },
  now = new Date(),
) {
  const start = new Date(event.startUtc);
  if (!Number.isFinite(start.getTime())) throw new Error("Invalid event time");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tsukuyomi Watch//Celestial Scroll//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeText(event.id)}@tsukuyomi-watch`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    event.endUtc ? `DTEND:${stamp(new Date(event.endUtc))}` : "DURATION:PT30M",
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description ?? "")}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}
