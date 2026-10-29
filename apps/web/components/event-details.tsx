"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  Moon,
  Rocket,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { ThemeToggle } from "~/components/theme-toggle";
import { downloadEventCalendar } from "~/lib/event-calendar";
import { z } from "zod";
import { JapaneseText } from "~/components/japanese-text";
import { ObservationForm } from "~/components/observation-form";
import { ThemeLandscape } from "~/components/theme-landscape";
import { BackgroundAlerts } from "~/components/background-alerts";

export function EventDetails({ id }: { id: string }) {
  const validId = z.uuid().safeParse(id).success;
  const query = trpc.celestial.event.useQuery(
    { id },
    { retry: false, staleTime: 60000, enabled: validId },
  );
  const data = query.data;
  const event = data?.event;
  const isMoon = data?.type === "MOON_PHASE";
  const start = event ? new Date(event.startUtc) : null;
  return (
    <div className="watchtower event-page">
      <div className="event-shell">
        <header className="watch-topbar">
          <JapaneseText meaning="Moon" asChild touchToggle={false}>
            <Link href="/" className="brand event-brand">
              <span>月</span> TSUKUYOMI WATCH
            </Link>
          </JapaneseText>
          <ThemeToggle />
        </header>
        <nav className="event-breadcrumb" aria-label="Breadcrumb">
          <Link href="/#celestial-scroll">
            <ArrowLeft size={15} />
            Celestial Scroll
          </Link>
          <span>/</span>
          <span>Event details</span>
        </nav>
        <ThemeLandscape />
        {query.isLoading && (
          <p className="watch-message" role="status">
            Opening your celestial scroll…
          </p>
        )}
        {(!validId || data === null) && (
          <section className="event-error">
            <p className="watch-eyebrow">THE SCROLL IS QUIET</p>
            <h1>Event not found</h1>
            <p>
              This event link is invalid or no longer available. Browse the Scroll to find an event.
            </p>
            <Link href="/#celestial-scroll" className="watch-primary">
              Browse events <ArrowUpRight size={16} />
            </Link>
          </section>
        )}
        {query.error && (
          <section className="event-error" role="alert">
            <p className="watch-eyebrow">THE SCROLL IS QUIET</p>
            <h1>
              {query.error.data?.code === "NOT_FOUND" || query.error.data?.code === "BAD_REQUEST"
                ? "Event not found"
                : "Unable to load this event"}
            </h1>
            <p>
              {query.error.data?.code === "BAD_REQUEST"
                ? "This event link is invalid. Return to the scroll to find an event."
                : query.error.message}
            </p>
            <Link href="/#celestial-scroll" className="watch-primary">
              Browse events <ArrowUpRight size={16} />
            </Link>
            {query.error.data?.code !== "NOT_FOUND" && query.error.data?.code !== "BAD_REQUEST" && (
              <button onClick={() => void query.refetch()}>Try again</button>
            )}
          </section>
        )}
        {event && start && (
          <>
            <section className="event-hero">
              <JapaneseText meaning={isMoon ? "Moon" : "Sky; heavens"} asChild>
                <div className="event-seal" tabIndex={0}>
                  {isMoon ? "月" : "天"}
                </div>
              </JapaneseText>
              <p className="watch-eyebrow">{data.label.toUpperCase()} · THE CELESTIAL SCROLL</p>
              <h1>{event.title}</h1>
              <p className="event-lead">
                {isMoon
                  ? "A moment in the moon’s eternal rhythm."
                  : data.type === "LAUNCH"
                    ? "Another journey from Earth to the stars."
                    : "A passing wonder in the celestial scroll."}
              </p>
              <button
                className="event-calendar-action"
                onClick={() => downloadEventCalendar(event)}
              >
                <CalendarPlus size={17} />
                Add to my calendar
              </button>
            </section>
            <div className="event-details-grid">
              <article className="event-story">
                <BackgroundAlerts eventId={event.id} />
                <ObservationForm
                  eventId={event.id}
                  title={event.title}
                  startUtc={new Date(event.startUtc).toISOString()}
                />
                <p className="watch-eyebrow">THE STORY BEHIND THE MOMENT</p>
                <h2>{isMoon ? "Read the moon." : "Follow the mission."}</h2>
                <p className="event-description">
                  {event.description ||
                    "The provider has not supplied a description for this event yet."}
                </p>
                <div className="event-observing-note">
                  {isMoon ? <Moon size={22} /> : <Rocket size={22} />}
                  <div>
                    <h3>{isMoon ? "Plan your observation" : "A changing horizon"}</h3>
                    <p>
                      {isMoon
                        ? "This time marks the global phase instant. Moonrise, altitude, weather, and visibility depend on your observing location. Check the Watchtower for your next nighttime forecast."
                        : data.type === "LAUNCH"
                          ? "Launch times may change. The site listed is the launch location; it does not predict visibility from where you are. Check the saved schedule again before making plans."
                          : data.type === "METEOR"
                            ? "This is an approximate seasonal observing window, not an exact annual peak time. Consult the linked annual forecast and check radiant altitude, moonlight and weather."
                            : "This is the calculated global eclipse maximum. Check local visibility and contact times before observing; use appropriate certified solar viewing protection for solar eclipses."}
                    </p>
                    <Link href="/#watchtower">
                      Open the Watchtower <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
              <aside className="event-facts" aria-label="Event timing and location">
                <h2>At a glance</h2>
                <div>
                  <CalendarDays size={18} />
                  <dl>
                    <dt>Your local date</dt>
                    <dd>{start.toLocaleDateString(undefined, { dateStyle: "full" })}</dd>
                  </dl>
                </div>
                <div>
                  <Clock size={18} />
                  <dl>
                    <dt>Your local time</dt>
                    <dd>
                      {start.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </dd>
                  </dl>
                </div>
                <div>
                  <MapPin size={18} />
                  <dl>
                    <dt>{data.type === "LAUNCH" ? "Launch site" : "Observation / visibility"}</dt>
                    <dd>
                      {event.visibilityRegion ||
                        (isMoon
                          ? "Global phase instant; local visibility varies."
                          : "Location not supplied by the provider.")}
                    </dd>
                  </dl>
                </div>
                <p className="event-utc">
                  UTC reference
                  <br />
                  <time dateTime={start.toISOString()}>
                    {start
                      .toISOString()
                      .replace("T", " ")
                      .replace(/\.\d{3}Z$/, " UTC")}
                  </time>
                </p>
              </aside>
            </div>
            <section className="event-provenance">
              <div>
                <p className="watch-eyebrow">FROM THE ARCHIVES</p>
                <h2>
                  {event.sourceApi === "USNO"
                    ? "US Naval Observatory"
                    : event.sourceApi === "LAUNCH_LIBRARY"
                      ? "The Space Devs · Launch Library"
                      : event.sourceApi}
                </h2>
                <p>
                  {data.syncedAt
                    ? `Feed last synced ${new Date(data.syncedAt).toLocaleString()}.`
                    : "A saved event record. This event is no longer part of a current feed snapshot."}{" "}
                  Details use saved feed data; the Scroll refreshes sources at most hourly.
                </p>
                <p>
                  Calendar downloads include a 30-minute reminder. Delivery depends on your calendar
                  app.
                </p>
              </div>
              {event.url && /^https:\/\//.test(event.url) && (
                <a href={event.url} target="_blank" rel="noreferrer">
                  Original source <ArrowUpRight size={14} />
                </a>
              )}
            </section>
          </>
        )}
        <footer className="watch-footer">
          <span>TSUKUYOMI WATCH</span>
          <span>One sky. A thousand stories.</span>
          <JapaneseText meaning="Together with the moon">月と共に</JapaneseText>
        </footer>
      </div>
    </div>
  );
}
