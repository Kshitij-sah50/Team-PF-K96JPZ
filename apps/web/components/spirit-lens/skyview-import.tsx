"use client";
import { useEffect, useRef, useState } from "react";
export type SkyViewSource = {
  target: string;
  survey: string;
  fieldDegrees: number;
  sourceUrl: string;
  retrievedAt: string;
};
export function SkyViewImport({
  disabled,
  onImport,
  onBusyChange,
}: {
  disabled: boolean;
  onImport: (file: File, source: SkyViewSource) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  const [target, setTarget] = useState("M31");
  const [survey, setSurvey] = useState("DSS");
  const [size, setSize] = useState("0.2");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return (
    <section className="lens-settings">
      <p className="watch-eyebrow">NASA SKYVIEW</p>
      <h2>Borrow a view.</h2>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (disabled || busy) return;
          setBusy(true);
          onBusyChange(true);
          setError("");
          const abort = new AbortController();
          controller.current = abort;
          try {
            const params = new URLSearchParams({ target, survey, size });
            const response = await fetch(`/api/skyview?${params}`, { signal: abort.signal });
            if (!response.ok)
              throw new Error((await response.json()).error || "SkyView is unavailable.");
            const blob = await response.blob();
            if (abort.signal.aborted) return;
            await onImport(
              new File([blob], `SkyView-${target.replace(/[^a-z0-9]/gi, "_")}-${survey}.jpg`, {
                type: "image/jpeg",
              }),
              {
                target,
                survey,
                fieldDegrees: Number(size),
                sourceUrl:
                  response.headers.get("X-SkyView-Source") || "https://skyview.gsfc.nasa.gov",
                retrievedAt: new Date().toISOString(),
              },
            );
          } catch (cause) {
            if (!abort.signal.aborted)
              setError(cause instanceof Error ? cause.message : "SkyView is unavailable.");
          } finally {
            setBusy(false);
            onBusyChange(false);
          }
        }}
      >
        <fieldset disabled={disabled || busy} className="bonus-form">
          <label>
            Target name or J2000 coordinates
            <input
              value={target}
              maxLength={80}
              required
              onChange={(e) => setTarget(e.target.value)}
              placeholder="M31 or 10.68, 41.27"
            />
          </label>
          <label>
            Survey
            <select value={survey} onChange={(e) => setSurvey(e.target.value)}>
              <option>DSS</option>
              <option>2MASS-J</option>
              <option>GALEX Near UV</option>
            </select>
          </label>
          <label>
            Field width (degrees)
            <input
              type="number"
              min="0.05"
              max="2"
              step="0.05"
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </label>
          <button type="submit">{busy ? "Requesting NASA image…" : "Import survey image"}</button>
        </fieldset>
      </form>
      {busy && (
        <button type="button" onClick={() => controller.current?.abort()}>
          Cancel import
        </button>
      )}
      {error && (
        <p role="alert" className="lens-error">
          {error}
        </p>
      )}
      <p className="lens-help">
        On-demand archival survey imagery, not a live camera. A 512 px display JPEG is imported;
        survey dates and wavelengths vary.{" "}
        <a
          href="https://skyview.gsfc.nasa.gov/current/docs/easy.html"
          target="_blank"
          rel="noreferrer"
        >
          NASA SkyView guide
        </a>
      </p>
    </section>
  );
}
