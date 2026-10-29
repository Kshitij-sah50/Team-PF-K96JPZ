"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BonusShell } from "~/components/bonus-shell";
import { HONOR_CHANGE, honorSummary, readJournal, type HonorEntry } from "~/lib/honor-journal";
import { downloadBlob } from "~/lib/spirit-lens/image";
export default function DojoPage() {
  const [entries, setEntries] = useState<HonorEntry[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const update = () => {
      try {
        setEntries(readJournal());
      } catch {
        setError("The journal could not be loaded from browser storage.");
      }
    };
    update();
    window.addEventListener(HONOR_CHANGE, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(HONOR_CHANGE, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const summary = honorSummary(entries);
  return (
    <BonusShell title="Every observation leaves a mark.">
      <p className="lens-help">
        Earn 25 Honor Points for each event you record from its detail page. This self-reported
        journal stays in this browser and is not a verified competition or account-synced
        leaderboard. Export it to keep a copy.
      </p>
      {error && (
        <p className="lens-error" role="alert">
          {error}
        </p>
      )}
      <div className="bonus-cards">
        <div>
          <strong>{summary.points}</strong>
          <span>Honor Points</span>
        </div>
        <div>
          <strong>{summary.count}</strong>
          <span>Events observed</span>
        </div>
        <div>
          <strong>{summary.badge}</strong>
          <span>Your current badge</span>
        </div>
      </div>
      <p className="lens-help">
        First Light · 25 points / Night Guardian · 100 points / Ronin Watcher · 250 points
      </p>
      <section className="bonus-panel">
        <h2>Observation ledger</h2>
        {entries.length === 0 ? (
          <p className="lens-help">
            Your first observation is waiting.{" "}
            <Link href="/#celestial-scroll">Browse the Celestial Scroll</Link>, open an event, and
            record what you saw.
          </p>
        ) : (
          <>
            <div className="bonus-table">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Observed</th>
                    <th>Notes</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((entry) => (
                    <tr key={entry.eventId}>
                      <td>
                        <Link href={`/events/${entry.eventId}`}>{entry.title}</Link>
                      </td>
                      <td>{new Date(entry.observedAt).toLocaleString()}</td>
                      <td>{entry.notes || "—"}</td>
                      <td>+{entry.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() =>
                downloadBlob(
                  new Blob(
                    [
                      JSON.stringify(
                        { version: 1, scope: "device-local self-reported", ...summary, entries },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  ),
                  "tsukuyomi-honor-journal.json",
                )
              }
            >
              Export journal
            </button>
          </>
        )}
      </section>
    </BonusShell>
  );
}
