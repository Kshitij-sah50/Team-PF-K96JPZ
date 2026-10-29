"use client";
import { useState } from "react";
import { BonusShell } from "~/components/bonus-shell";
import { analyzeSamples, parseSamples, type AnalysisMode } from "~/lib/transient-analysis";
import { downloadBlob } from "~/lib/spirit-lens/image";
function demo(mode: AnalysisMode) {
  return (
    `${mode === "time" ? "time_utc" : "wavelength_nm"},flux,error\n` +
    Array.from(
      { length: 60 },
      (_, index) =>
        `${mode === "time" ? new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() : 400 + index * 5},${(100 + Math.sin(index * 2.3) * 2 + (index === 35 ? 35 : 0)).toFixed(3)},2`,
    ).join("\n")
  );
}
export default function AnalysisPage() {
  const [mode, setMode] = useState<AnalysisMode>("time"),
    [csv, setCsv] = useState(""),
    [threshold, setThreshold] = useState(5),
    [result, setResult] = useState<ReturnType<typeof analyzeSamples> | null>(null),
    [error, setError] = useState("");
  const points = result?.points ?? [];
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.flux);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const px = (x: number) => 40 + ((x - minX) / (maxX - minX || 1)) * 820,
    py = (y: number) => 250 - ((y - minY) / (maxY - minY || 1)) * 215;
  return (
    <BonusShell title="Listen for a change in the light.">
      <p className="lens-help">
        Explore a light curve for transient candidates, or a spectrum for emission and absorption
        candidates. Upload measurements from the same target, instrument, and band with consistent
        flux units. Processing stays on your device.
      </p>
      <form
        className="bonus-panel bonus-form"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            setResult(analyzeSamples(parseSamples(csv, mode), mode, threshold));
            setError("");
          } catch (cause) {
            setResult(null);
            setError((cause as Error).message);
          }
        }}
      >
        <label>
          Analysis
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as AnalysisMode);
              setCsv("");
              setResult(null);
              setError("");
            }}
          >
            <option value="time">Time-domain light curve</option>
            <option value="spectrum">Wavelength spectrum</option>
          </select>
        </label>
        <label>
          Candidate threshold (sigma)
          <input
            type="number"
            min={3}
            max={10}
            step={0.5}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            required
          />
        </label>
        <label>
          Import CSV (up to 1 MB)
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 1000000) {
                setError("CSV must be smaller than 1 MB.");
                return;
              }
              setCsv(await file.text());
              setResult(null);
            }}
          />
        </label>
        <label>
          Measurements
          <textarea
            rows={9}
            value={csv}
            onChange={(event) => {
              setCsv(event.target.value);
              setResult(null);
            }}
            placeholder={
              mode === "time"
                ? "time_utc,flux,error\n2026-10-30T20:00:00Z,100,2"
                : "wavelength_nm,flux,error\n500,100,2"
            }
            maxLength={1000000}
            required
          />
        </label>
        <div className="bonus-actions">
          <button
            type="button"
            onClick={() => {
              setCsv(demo(mode));
              setResult(null);
              setError("");
            }}
          >
            Load synthetic example
          </button>
          <button type="submit">Analyze measurements</button>
        </div>
      </form>
      {error && (
        <p className="lens-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section className="bonus-panel" aria-live="polite">
          <h2>
            {result.candidates.length} {result.mode === "time" ? "transient" : "spectral feature"}{" "}
            candidates
          </h2>
          <p className="lens-help">
            {points.length} samples · robust scatter {result.scatter.toPrecision(3)} · threshold{" "}
            {result.threshold}σ
          </p>
          {result.insufficientNoise && (
            <p className="lens-error">
              Some samples have no measurable noise or supplied uncertainty. Their significance
              cannot be estimated.
            </p>
          )}
          <svg
            className="signal-chart"
            viewBox="0 0 900 290"
            role="img"
            aria-label="Flux measurements with candidates highlighted"
          >
            <path d={`M40 15V250H875`} fill="none" stroke="currentColor" opacity=".4" />
            <polyline
              points={points.map((p) => `${px(p.x)},${py(p.flux)}`).join(" ")}
              fill="none"
              stroke="currentColor"
              opacity=".5"
            />
            {points.map((p, index) => (
              <circle
                key={index}
                cx={px(p.x)}
                cy={py(p.flux)}
                r={p.candidate ? 5 : 2.5}
                fill={p.candidate ? "var(--watch-vermilion)" : "var(--watch-accent)"}
              >
                <title>
                  {result.mode === "time" ? new Date(p.x).toISOString() : `${p.x} nm`} · flux{" "}
                  {p.flux} · {p.score?.toFixed(2) ?? "unknown"}σ
                </title>
              </circle>
            ))}
            <text x="40" y="280" fill="currentColor" fontSize="11">
              {result.mode === "time" ? new Date(minX).toISOString() : `${minX} nm`}
            </text>
            <text x="875" y="280" textAnchor="end" fill="currentColor" fontSize="11">
              {result.mode === "time" ? new Date(maxX).toISOString() : `${maxX} nm`}
            </text>
            <text x="5" y="20" fill="currentColor" fontSize="10">
              Flux
            </text>
          </svg>
          <div className="bonus-table">
            <table>
              <thead>
                <tr>
                  <th>{result.mode === "time" ? "Time (UTC)" : "Wavelength (nm)"}</th>
                  <th>Flux</th>
                  <th>Deviation</th>
                  <th>Candidate</th>
                </tr>
              </thead>
              <tbody>
                {result.candidates.map((p) => (
                  <tr key={p.x}>
                    <td>{result.mode === "time" ? new Date(p.x).toISOString() : p.x}</td>
                    <td>{p.flux}</td>
                    <td>{p.score?.toFixed(2)}σ</td>
                    <td>{p.score! > 0 ? "Brightening / peak" : "Dimming / trough"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                new Blob(
                  [
                    JSON.stringify(
                      {
                        ...result,
                        method:
                          result.mode === "time"
                            ? "global median + MAD"
                            : "11-sample local median + residual MAD",
                        notes:
                          "Unconfirmed candidates; sampling, trends and instrument systematics can cause false positives.",
                      },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                ),
                "signal-analysis.json",
              )
            }
          >
            Download analysis JSON
          </button>
        </section>
      )}
      <details className="lens-method">
        <summary>How candidates are calculated</summary>
        <p>
          Time analysis uses a global median baseline and robust scatter (1.4826 × median absolute
          deviation). Spectral analysis subtracts an 11-sample local median, excluding the evaluated
          sample. The denominator combines robust scatter and each supplied measurement error in
          quadrature. Absolute deviations above the selected threshold are flagged.
        </p>
        <p>
          These are screening estimates, not formal discovery significance. Trends, correlated
          errors, multiple comparisons, uneven sampling and calibration errors can produce false
          positives. Spectral features alone do not establish a transient; confirm with repeated
          observations. No period, redshift, element identity, or physical classification is
          inferred.
        </p>
      </details>
    </BonusShell>
  );
}
