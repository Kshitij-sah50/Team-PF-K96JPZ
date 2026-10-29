"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HONOR_CHANGE, readJournal, recordObservation } from "~/lib/honor-journal";
import "~/app/bonuses.css";
export function ObservationForm({
  eventId,
  title,
  startUtc,
}: {
  eventId: string;
  title: string;
  startUtc: string;
}) {
  const [recorded, setRecorded] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notes, setNotes] = useState(""),
    [busy, setBusy] = useState(false),
    [observed, setObserved] = useState("");
  useEffect(() => {
    const update = () => {
      try {
        setRecorded(readJournal().some((entry) => entry.eventId === eventId));
        setReady(true);
      } catch {
        setError("Browser storage is unavailable or the saved journal is invalid.");
      }
    };
    update();
    window.addEventListener(HONOR_CHANGE, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(HONOR_CHANGE, update);
      window.removeEventListener("storage", update);
    };
  }, [eventId]);
  return (
    <section className="honor-observation">
      <h2>Your night, remembered.</h2>
      <p className="lens-help">
        Record an event you observed to earn 25 Honor Points. This is a self-reported journal saved
        on this device, with one award per event. <Link href="/dojo">View your Honor journal</Link>
      </p>
      {recorded ? (
        <p role="status">Recorded · +25 Honor Points</p>
      ) : (
        <form
          className="bonus-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              await recordObservation({
                eventId,
                title,
                startUtc,
                observedAt: observed ? new Date(observed).toISOString() : new Date().toISOString(),
                notes,
              });
              setRecorded(true);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not save the observation.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Observed at (your local time; leave blank for now)
            <input
              type="datetime-local"
              value={observed}
              onChange={(event) => setObserved(event.target.value)}
            />
          </label>
          <label>
            Observation notes
            <textarea
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <button type="submit" disabled={!ready || busy}>
            {busy ? "Saving…" : "I observed this event · +25"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="lens-error">
          {error}
        </p>
      )}
    </section>
  );
}
