"use client";
import { useEffect, useState } from "react";
import { Bell, CalendarPlus, Moon, X } from "lucide-react";
import { trpc } from "~/trpc/client";
import { downloadEventCalendar } from "~/lib/event-calendar";
import {
  moonriseMessage,
  readReminders,
  reminderEvent,
  saveReminders,
  type MoonReminder,
} from "~/lib/moon-reminders";

function MoonDisc({ phase, illumination }: { phase: string; illumination: number }) {
  const fraction = illumination / 100,
    radius = Math.abs(1 - 2 * fraction) * 45;
  const path = `M50 5A45 45 0 0 1 50 95A${radius} 45 0 0 ${fraction > 0.5 ? 1 : 0} 50 5Z`;
  const waning = /waning|last quarter/i.test(phase);
  return (
    <svg
      className="moon-phase-disc"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${phase}, ${illumination}% illuminated`}
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="var(--watch-moon-shadow, #151426)"
        stroke="var(--watch-accent-border)"
      />
      {fraction >= 0.999 ? (
        <circle cx="50" cy="50" r="45" fill="var(--watch-moon-center)" />
      ) : (
        fraction > 0.001 && (
          <path
            d={path}
            fill="var(--watch-moon-center)"
            transform={waning ? "translate(100 0) scale(-1 1)" : undefined}
          />
        )
      )}
      <circle cx="34" cy="35" r="6" fill="var(--watch-decoration)" opacity=".25" />
      <circle cx="59" cy="64" r="10" fill="var(--watch-decoration)" opacity=".2" />
    </svg>
  );
}

export function MoonTracker({
  locationId,
  locationName,
}: {
  locationId: string;
  locationName: string;
}) {
  const query = trpc.watchtower.moon.useQuery(
    { locationId },
    { staleTime: 1800000, refetchInterval: 1800000, retry: 1 },
  );
  const [now, setNow] = useState<Date | null>(null),
    [lead, setLead] = useState(15),
    [reminders, setReminders] = useState<MoonReminder[]>([]),
    [message, setMessage] = useState("");
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    const update = () => setReminders(readReminders());
    update();
    window.addEventListener(reminderEvent, update);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener(reminderEvent, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const timeZone = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const rise = now
    ? query.data?.rises.map((value) => new Date(value)).find((value) => value > now)
    : undefined;
  const nextSet = now
    ? query.data?.sets.map((value) => new Date(value)).find((value) => value > now)
    : undefined;
  const format = (date: Date) =>
    date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  const reminderId = rise ? `moon:${locationId}:${rise.toISOString()}` : null;
  useEffect(() => setMessage(""), [locationId]);
  const saved = reminders.some((item) => item.id === reminderId && !item.sent);
  function addAlert() {
    if (!rise || !now || !reminderId) return;
    try {
      const current = readReminders();
      if (current.some((item) => item.id === reminderId && !item.sent)) return;
      const alertAt = new Date(Math.max(Date.now() + 1000, rise.getTime() - lead * 60000));
      saveReminders(
        [
          ...current.filter((item) => item.id !== reminderId),
          {
            id: reminderId,
            locationName,
            riseAt: rise.toISOString(),
            alertAt: alertAt.toISOString(),
            timeZone,
            sent: false,
          },
        ].slice(-20),
      );
      setMessage(`Alert saved for ${format(alertAt)}. Keep this app open to receive it.`);
    } catch {
      setMessage(
        "Your browser could not save the alert. You can still add moonrise to your calendar.",
      );
    }
  }
  function cancel(id: string) {
    try {
      saveReminders(readReminders().filter((item) => item.id !== id));
      setMessage("Alert removed.");
    } catch {
      setMessage("Could not remove the alert from browser storage.");
    }
  }
  return (
    <section className="moon-tracker" aria-label="Moon phase tracker and alerts">
      <div className="moon-tracker-heading">
        <div>
          <p className="watch-eyebrow">THE MOON’S WATCH · 月の便り</p>
          <h2>Your next moment with the moon.</h2>
          <p>
            {locationName} · Times shown in {timeZone}
          </p>
        </div>
        <Moon size={24} />
      </div>
      {query.isLoading && (
        <p className="watch-message" role="status">
          Reading the moon’s passage…
        </p>
      )}
      {query.error && (
        <p className="watch-message" role="alert">
          {query.error.message} <button onClick={() => void query.refetch()}>Retry</button>
        </p>
      )}
      {query.data && (
        <div className="moon-tracker-body">
          <div className="moon-phase-summary">
            <MoonDisc phase={query.data.phaseName} illumination={query.data.illuminationPct} />
            <div>
              <small>DAILY LUNAR PHASE</small>
              <h3>{query.data.phaseName}</h3>
              <p>{query.data.illuminationPct}% illuminated</p>
              <meter
                min="0"
                max="100"
                value={query.data.illuminationPct}
                aria-label="Moon illumination"
              />
            </div>
          </div>
          <div className="moon-rise-summary">
            <p className="moonrise-message">
              {rise && now
                ? moonriseMessage(rise, now, timeZone)
                : now
                  ? "No upcoming moonrise in the available three-day window."
                  : "Preparing your local moonrise time…"}
            </p>
            <p>Next moonset: {nextSet ? format(nextSet) : "Not in the available window"}</p>
            <div className="moon-alert-controls">
              <label>
                Remind me{" "}
                <select value={lead} onChange={(event) => setLead(Number(event.target.value))}>
                  <option value={0}>At moonrise</option>
                  <option value={15}>15 min before</option>
                  <option value={30}>30 min before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </label>
              <button disabled={!rise || saved} onClick={addAlert}>
                <Bell size={14} />
                {saved ? "Alert saved" : "Set moonrise alert"}
              </button>
              <button
                disabled={!rise}
                onClick={() => {
                  if (rise)
                    downloadEventCalendar({
                      id: reminderId!,
                      title: `Moonrise at ${locationName}`,
                      description: `Moonrise at ${locationName}. Source: US Naval Observatory.`,
                      startUtc: rise,
                    });
                }}
              >
                <CalendarPlus size={14} />
                Calendar
              </button>
            </div>
            <p className="moon-alert-status" role="status">
              {message}
            </p>
          </div>
        </div>
      )}
      {reminders.filter((item) => !item.sent).length > 0 && (
        <div className="moon-alert-queue">
          <h3>Your saved moonrise alerts</h3>
          {reminders
            .filter((item) => !item.sent)
            .sort((a, b) => Date.parse(a.alertAt) - Date.parse(b.alertAt))
            .map((item) => (
              <div key={item.id}>
                <Bell size={13} />
                <span>
                  {item.locationName}
                  <small>{format(new Date(item.alertAt))}</small>
                </span>
                <button
                  aria-label={`Remove alert for ${item.locationName}`}
                  onClick={() => cancel(item.id)}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
        </div>
      )}
      <p className="moon-tracker-note">
        Daily phase and rise/set predictions by{" "}
        <a href="https://aa.usno.navy.mil/data/api" target="_blank" rel="noreferrer">
          US Naval Observatory
        </a>
        {query.data ? ` · UTC date ${query.data.asOfUtc}` : ""}. Alerts are saved on this device and
        appear in-app while it is open. For reminders after closing the app, use Calendar. No email
        or background push is sent.
      </p>
    </section>
  );
}
