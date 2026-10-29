"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarPlus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { trpc } from "~/trpc/client";
import { buildEventCalendar } from "~/lib/event-calendar";

export function CelestialScroll() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [type, setType] = useState<"ALL" | "MOON_PHASE" | "LAUNCH">("ALL");
  const [day, setDay] = useState<number | null>(null);
  const query = trpc.celestial.events.useQuery(
    { month, type: type === "ALL" ? undefined : type },
    { staleTime: 300000, retry: 1 },
  );
  const start = new Date(`${month}-01T00:00:00Z`);
  const year = start.getUTCFullYear();
  const totalDays = new Date(Date.UTC(year, start.getUTCMonth() + 1, 0)).getUTCDate();
  const currentYear = new Date().getUTCFullYear();
  const events = query.data?.events ?? [];
  const visible = events.filter(
    ({ event }) => day === null || new Date(event.startUtc).getUTCDate() === day,
  );
  function changeMonth(offset: number) {
    const next = new Date(start);
    next.setUTCMonth(next.getUTCMonth() + offset);
    if (Math.abs(next.getUTCFullYear() - currentYear) > 1) return;
    setMonth(next.toISOString().slice(0, 7));
    setDay(null);
  }
  function download(event: Parameters<typeof buildEventCalendar>[0]) {
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
  return (
    <section id="celestial-scroll" className="celestial-scroll">
      <div className="watch-section-title">
        <div>
          <p className="watch-eyebrow">THE CELESTIAL SCROLL · 天の巻物</p>
          <h2>Keep time with the heavens.</h2>
        </div>
        <span>02 / DISCOVER</span>
      </div>
      <div className="watch-toolbar">
        <p>Primary moon phases and rocket launches. Every moment has a story.</p>
        <button onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCw size={14} className={query.isFetching ? "watch-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="scroll-filters" aria-label="Event type">
        {(
          [
            { value: "ALL", label: "All events" },
            { value: "MOON_PHASE", label: "Moon phases" },
            { value: "LAUNCH", label: "Rocket launches" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            aria-pressed={type === option.value}
            onClick={() => {
              setType(option.value);
              setDay(null);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="scroll-layout">
        <div className="scroll-calendar">
          <div className="scroll-month">
            <button
              aria-label="Previous month"
              disabled={year === currentYear - 1 && start.getUTCMonth() === 0}
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={16} />
            </button>
            <h3>
              {start.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </h3>
            <button
              aria-label="Next month"
              disabled={year === currentYear + 1 && start.getUTCMonth() === 11}
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="scroll-days" aria-label="Calendar, dates in UTC">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label) => (
              <span className="scroll-weekday" key={label}>
                {label}
              </span>
            ))}
            {Array.from({ length: start.getUTCDay() }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: totalDays }, (_, index) => {
              const date = index + 1;
              const daily = events.filter(
                ({ event }) => new Date(event.startUtc).getUTCDate() === date,
              );
              const phase = daily.find((item) => item.type === "MOON_PHASE")?.event.title;
              const symbol =
                phase === "Full Moon"
                  ? "●"
                  : phase === "New Moon"
                    ? "○"
                    : phase === "First Quarter"
                      ? "◐"
                      : phase === "Last Quarter"
                        ? "◑"
                        : "·";
              return (
                <button
                  key={date}
                  aria-label={`${month}-${String(date).padStart(2, "0")}, ${daily.length} events${phase ? `, ${phase}` : ""}`}
                  aria-pressed={day === date}
                  className={daily.length ? "has-events" : ""}
                  onClick={() => setDay((previous) => (previous === date ? null : date))}
                >
                  <span>{date}</span>
                  <small aria-hidden="true">{daily.length ? symbol : ""}</small>
                </button>
              );
            })}
          </div>
          <p>
            Calendar dates use UTC.
            <br />
            Event times below use your local timezone.
          </p>
          <button className="scroll-show-month" onClick={() => setDay(null)}>
            Show whole month
          </button>
        </div>
        <div className="scroll-event-list" aria-live="polite">
          {query.isLoading && (
            <p className="watch-message" role="status">
              Unrolling the celestial scroll…
            </p>
          )}
          {query.error && (
            <p className="watch-message" role="alert">
              {query.error.message}
            </p>
          )}
          {!query.isLoading && !query.error && visible.length === 0 && (
            <p className="watch-message">
              {query.data?.feeds.some((feed) => feed.failed)
                ? "No events available for this selection. A source is unavailable; check its status below."
                : "No events match this selection. Choose another date or event type."}
            </p>
          )}
          {visible.map(({ event, label, type: eventType }) => (
            <article className="scroll-event" key={event.id}>
              <div className="scroll-event-symbol" aria-hidden="true">
                {eventType === "MOON_PHASE" ? "月" : "天"}
              </div>
              <div className="scroll-event-content">
                <small>
                  {label.toUpperCase()} ·{" "}
                  {event.sourceApi === "USNO" ? "US NAVAL OBSERVATORY" : "THE SPACE DEVS"}
                </small>
                <h3>{event.title}</h3>
                <time dateTime={new Date(event.startUtc).toISOString()}>
                  {new Date(event.startUtc).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
                <p>{event.description}</p>
                {event.visibilityRegion && (
                  <p>
                    Launch site: {event.visibilityRegion}. Visibility from your location is not
                    predicted.
                  </p>
                )}
                <div className="scroll-event-actions">
                  <button onClick={() => download(event)}>
                    <CalendarPlus size={14} />
                    Add to calendar
                  </button>
                  {event.url && (
                    <a href={event.url} target="_blank" rel="noreferrer">
                      View source <ArrowUpRight size={13} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="scroll-feed-status">
        {query.data?.feeds.map((feed) => (
          <p key={feed.source}>
            <strong>{feed.source === "USNO" ? "USNO moon phases" : "Launch Library"}:</strong>{" "}
            {feed.failed
              ? feed.succeededAt
                ? "Source unavailable; showing saved events."
                : "Source unavailable; no saved feed yet."
              : "Connected."}
            {feed.succeededAt && ` Last synced ${new Date(feed.succeededAt).toLocaleString()}.`}
            {feed.truncated && " Showing the first 100 results."}
          </p>
        ))}
        <p>
          Feeds refresh at most hourly; failed requests retry after 10 minutes. Imported calendar
          events include a 30-minute reminder, subject to your calendar app’s settings. Launch
          schedules can change. No email or background alerts are sent yet.
        </p>
        <p>
          Meteor showers, eclipses, and location-specific ISS passes are planned next. This is a
          Gregorian calendar with lunar phase markers.
        </p>
      </div>
    </section>
  );
}
