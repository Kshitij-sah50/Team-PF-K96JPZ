import {
  SearchGlobalSolarEclipse,
  NextGlobalSolarEclipse,
  SearchLunarEclipse,
  NextLunarEclipse,
} from "astronomy-engine";
import { monthBounds, type NormalizedEvent } from "./providers";

export async function fetchEclipses(month: string) {
  const { start, end } = monthBounds(month);
  const events: NormalizedEvent[] = [];
  let solar = SearchGlobalSolarEclipse(start),
    lunar = SearchLunarEclipse(start);
  while (solar.peak.date < end) {
    const date = solar.peak.date;
    events.push({
      title: `${solar.kind} solar eclipse`,
      startUtc: date,
      sourceApi: "ASTRONOMY_ENGINE",
      externalId: `solar:${date.toISOString()}`,
      url: "https://science.nasa.gov/eclipses/",
      visibilityRegion: "Global event; visibility depends on the eclipse path.",
      description:
        "Calculated global maximum, not local contact times. Never look at the Sun without appropriate certified solar viewing protection. Check the eclipse path before planning an observation.",
    });
    solar = NextGlobalSolarEclipse(solar.peak);
  }
  while (lunar.peak.date < end) {
    const date = lunar.peak.date;
    events.push({
      title: `${lunar.kind} lunar eclipse`,
      startUtc: date,
      sourceApi: "ASTRONOMY_ENGINE",
      externalId: `lunar:${date.toISOString()}`,
      url: "https://science.nasa.gov/eclipses/",
      visibilityRegion: "Visible where the Moon is above the horizon during the eclipse.",
      description: `Calculated greatest eclipse in UTC. Penumbral duration approximately ${Math.round(lunar.sd_penum * 2)} minutes. Local Moon altitude and weather determine visibility.`,
    });
    lunar = NextLunarEclipse(lunar.peak);
  }
  return { events, truncated: false };
}

// Recurring observing windows, not exact annual maxima or live detections.
const showers = [
  ["Quadrantids", 1, 3],
  ["Lyrids", 4, 22],
  ["Eta Aquariids", 5, 6],
  ["Perseids", 8, 12],
  ["Orionids", 10, 21],
  ["Leonids", 11, 17],
  ["Geminids", 12, 14],
  ["Ursids", 12, 22],
] as const;
export async function fetchMeteors(month: string) {
  const { start } = monthBounds(month);
  return {
    truncated: false,
    events: showers
      .filter(([, m]) => m === start.getUTCMonth() + 1)
      .map(
        ([name, m, d]): NormalizedEvent => ({
          title: `${name} · expected peak window`,
          startUtc: new Date(Date.UTC(start.getUTCFullYear(), m - 1, d, 12)),
          sourceApi: "IMO_SEASONAL",
          externalId: `${start.getUTCFullYear()}:${name}`,
          url: "https://www.imo.net/calendar/",
          visibilityRegion: null,
          description:
            "Approximate recurring peak date, with a ±1 day observing window; noon UTC is a calendar placeholder, not a predicted peak instant. Annual maxima, outbursts, radiant altitude and moonlight vary. Consult the linked IMO annual calendar for the year's detailed forecast.",
        }),
      ),
  };
}
