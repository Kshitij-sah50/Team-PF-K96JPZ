"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
  FileImage,
  Focus,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Telescope,
  Upload,
  X,
} from "lucide-react";
import { JapaneseText } from "~/components/japanese-text";
import { ThemeToggle } from "~/components/theme-toggle";
import { ComparisonView } from "./comparison-view";
import {
  decodeImageFile,
  downloadBlob,
  pixelsToBlob,
  syntheticImage,
  type LensInput,
} from "~/lib/spirit-lens/image";
import {
  LENS_MODEL,
  STRENGTHS,
  type LensMetrics,
  type LensObject,
  type LensResponse,
  type LensStrength,
} from "~/lib/spirit-lens/model";
import "~/app/spirit-lens.css";
import { SkyViewImport, type SkyViewSource } from "./skyview-import";
import { ThemeLandscape } from "../theme-landscape";
import "~/app/bonuses.css";

type LensResult = {
  deblur: boolean;
  blurRadius: number;
  blob: Blob;
  objects: LensObject[];
  metrics: LensMetrics;
  elapsedMs: number;
  strength: LensStrength;
};

function useBlobUrl(blob?: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export function SpiritLens() {
  const [input, setInput] = useState<LensInput | null>(null);
  const [skySource, setSkySource] = useState<SkyViewSource | null>(null);
  const [result, setResult] = useState<LensResult | null>(null);
  const [strength, setStrength] = useState<LensStrength>("gentle");
  const [deblur, setDeblur] = useState(false);
  const [blurRadius, setBlurRadius] = useState(1.1);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState("Choose an image to begin.");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const worker = useRef<Worker | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const originalUrl = useBlobUrl(input?.preview);
  const restoredUrl = useBlobUrl(result?.blob);
  const locked = busy || loading || remoteBusy;
  const object = result?.objects.find((item) => item.id === selected);

  function stopWorker() {
    worker.current?.terminate();
    worker.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
  }
  useEffect(
    () => () => {
      generation.current++;
      stopWorker();
    },
    [],
  );

  async function openImage(file?: File, source?: SkyViewSource) {
    if (busy || loading || (remoteBusy && !source)) return;
    const version = ++generation.current;
    setLoading(true);
    setError("");
    setStatus("Opening your image…");
    try {
      const image = file ? await decodeImageFile(file) : await syntheticImage();
      if (generation.current !== version) return;
      setInput(image);
      setSkySource(source ?? null);
      setResult(null);
      setSelected(null);
      setProgress(0);
      setStatus("Image ready. Choose a cleanup strength, then restore.");
    } catch (cause) {
      if (generation.current !== version) return;
      setError(cause instanceof Error ? cause.message : "Could not open this image.");
      setStatus(input ? "Your previous image is still ready." : "Choose an image to begin.");
    } finally {
      if (generation.current === version) setLoading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function restore() {
    if (!input || locked) return;
    const version = ++generation.current;
    stopWorker();
    setBusy(true);
    setError("");
    setResult(null);
    setSelected(null);
    setProgress(1);
    setStatus("Starting the restoration engine…");
    const fail = (message: string) => {
      if (generation.current !== version) return;
      generation.current++;
      stopWorker();
      setBusy(false);
      setError(message);
      setStatus("Restoration stopped. Your input is ready to retry.");
    };
    try {
      const engine = new Worker(
        new URL("../../lib/spirit-lens/spirit-lens.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = engine;
      timeout.current = setTimeout(
        () => fail("This image took too long to process. Try a smaller image or a faster device."),
        180000,
      );
      engine.onerror = () =>
        fail("The restoration engine stopped unexpectedly. Try again or choose a smaller image.");
      engine.onmessage = async ({ data }: MessageEvent<LensResponse>) => {
        if (generation.current !== version) return;
        if (data.type === "progress") {
          setStatus(data.message);
          setProgress(data.progress);
        }
        if (data.type === "error") fail(data.message);
        if (data.type === "result") {
          stopWorker();
          try {
            const blob = await pixelsToBlob(
              new Uint8ClampedArray(data.pixels),
              input.width,
              input.height,
            );
            if (generation.current !== version) return;
            setResult({
              deblur,
              blurRadius,
              blob,
              objects: data.objects,
              metrics: data.metrics,
              elapsedMs: data.elapsedMs,
              strength,
            });
            setSelected(data.objects[0]?.id ?? null);
            setProgress(100);
            setBusy(false);
            setStatus(
              `Restoration complete in ${(data.elapsedMs / 1000).toFixed(1)} seconds. ${data.objects.length} candidate objects found.`,
            );
          } catch {
            fail("The restored preview could not be created. Please try again.");
          }
        }
      };
      const pixels = input.pixels.slice().buffer;
      engine.postMessage(
        {
          origin: window.location.origin,
          deblur,
          blurRadius,
          pixels,
          width: input.width,
          height: input.height,
          strength,
        },
        [pixels],
      );
    } catch {
      fail("This browser could not start local processing. Try a recent browser version.");
    }
  }

  function cancel() {
    generation.current++;
    stopWorker();
    setBusy(false);
    setProgress(0);
    setError("");
    setStatus("Restoration cancelled. Your original preview is ready.");
  }

  function downloadReport() {
    if (!input || !result) return;
    const report = {
      schemaVersion: 1,
      skyViewSource: skySource,
      deblurring: result.deblur
        ? {
            method: "Richardson-Lucy",
            iterations: 6,
            gaussianSigmaPx: result.blurRadius,
            sourceCoresProtected: true,
          }
        : null,
      createdAt: new Date().toISOString(),
      source: {
        name: input.name,
        sha256: input.fileHash,
        synthetic: input.synthetic,
        originalWidth: input.originalWidth,
        originalHeight: input.originalHeight,
        workingWidth: input.width,
        workingHeight: input.height,
      },
      model: LENS_MODEL,
      settings: {
        strength: result.strength,
        ...STRENGTHS[result.strength],
        luminanceOnly: true,
        protectedCandidateRegions: !result.deblur,
        protectedCandidateCores: result.deblur,
      },
      elapsedMs: result.elapsedMs,
      metrics: result.metrics,
      objects: result.objects,
      notes: [
        "8-bit RGB working preview; transparent pixels composited onto black.",
        "Object detection uses original-preview morphology, not an AI classifier. Extended sources are unconfirmed galaxy/nebula/blend candidates.",
        "Coordinates and areas refer to the working preview. Brightness and flux are uncalibrated display values, not astronomical magnitudes.",
        "PSNR and SSIM compare with the noisy input, not a clean reference, and cannot establish scientific accuracy.",
        "Noise and Laplacian sharpness are estimates. This general-photo denoiser is not validated for astronomical measurements.",
      ],
    };
    downloadBlob(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
      "spirit-lens-report.json",
    );
  }

  return (
    <div className="watchtower lens-page">
      <div className="lens-shell">
        <header className="watch-topbar">
          <JapaneseText meaning="Moon" asChild touchToggle={false}>
            <Link className="event-brand" href="/">
              <span>月</span> TSUKUYOMI WATCH
            </Link>
          </JapaneseText>
          <ThemeToggle />
        </header>
        <nav className="event-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">
            <ArrowLeft size={15} /> The Watchtower
          </Link>
          <span>/</span>
          <span>Spirit Lens</span>
        </nav>
        <ThemeLandscape />
        <section className="lens-hero">
          <div>
            <p className="watch-eyebrow">
              03 / THE SPIRIT LENS · <JapaneseText meaning="Mirror; lens">鏡</JapaneseText>
            </p>
            <h1>
              Let the quiet
              <br />
              <em>details emerge.</em>
            </h1>
            <p>
              A gentler view of your cosmos. Reduce noise, compare every change,
              <br className="lens-wide-break" /> and explore the light already captured in your
              image.
            </p>
          </div>
          <div className="lens-emblem" aria-hidden="true">
            <i />
            <i />
            <i />
            <Telescope size={42} strokeWidth={1} />
            <span>LIGHT, REVEALED</span>
          </div>
        </section>
        <div className="lens-promises">
          <span>
            <ShieldCheck size={15} /> Images stay on your device
          </span>
          <span>
            <Focus size={15} /> Original file preserved
          </span>
          <span>
            <Sparkles size={15} /> Pretrained AI denoising
          </span>
        </div>
        <main className="lens-workspace">
          <aside className="lens-controls" aria-label="Restoration controls">
            <p className="watch-eyebrow">01 / YOUR CAPTURE</p>
            <h2>Bring a little sky.</h2>
            <div
              className={`lens-upload ${dragging ? "is-dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (!locked) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (locked) return;
                if (event.dataTransfer.files.length !== 1) {
                  setError("Choose one image at a time.");
                  return;
                }
                void openImage(event.dataTransfer.files[0]);
              }}
            >
              <Upload size={26} strokeWidth={1.3} />
              <strong>Drop your space image</strong>
              <span>PNG, JPEG or WebP · up to 12 MB</span>
              <button type="button" onClick={() => fileInput.current?.click()} disabled={locked}>
                Choose image <ArrowUpRight size={14} />
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Choose a space image"
                disabled={locked}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void openImage(file);
                }}
              />
            </div>
            <button
              type="button"
              className="lens-demo"
              onClick={() => void openImage()}
              disabled={locked}
            >
              Try a synthetic star field <ArrowUpRight size={13} />
            </button>
            {input && (
              <div className="lens-file">
                <FileImage size={18} />
                <div>
                  <strong>{input.name}</strong>
                  <span>
                    {input.originalWidth} × {input.originalHeight} px
                  </span>
                  <span>
                    Working preview: {input.width} × {input.height} px
                  </span>
                  {input.synthetic && <span>Synthetic demonstration, not an observation</span>}
                </div>
              </div>
            )}
            <SkyViewImport
              disabled={busy || loading}
              onImport={openImage}
              onBusyChange={setRemoteBusy}
            />
            {skySource && (
              <p className="lens-help">
                Imported from NASA SkyView · {skySource.survey} · {skySource.target} ·{" "}
                {skySource.fieldDegrees}° field.{" "}
                <a href={skySource.sourceUrl} target="_blank" rel="noreferrer">
                  Source query
                </a>
              </p>
            )}
            <div className="lens-settings">
              <label className="lens-help">
                <input
                  type="checkbox"
                  checked={deblur}
                  disabled={locked}
                  onChange={(event) => setDeblur(event.target.checked)}
                />{" "}
                Reduce blur after AI denoising
              </label>
              {deblur && (
                <label className="lens-help">
                  Estimated blur radius: {blurRadius.toFixed(1)} px{" "}
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={blurRadius}
                    disabled={locked}
                    onChange={(event) => setBlurRadius(Number(event.target.value))}
                  />
                </label>
              )}
              {deblur && (
                <p className="lens-help">
                  Uses six Richardson–Lucy iterations with an assumed Gaussian blur kernel. Start
                  with a small radius and compare for ringing; source cores and bounded changes
                  remain protected.
                </p>
              )}
              <p className="watch-eyebrow">02 / RESTORATION</p>
              <h2>A careful touch.</h2>
              <fieldset disabled={locked}>
                <legend>Cleanup strength</legend>
                <div className="lens-strengths">
                  {(Object.keys(STRENGTHS) as LensStrength[]).map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="strength"
                        value={value}
                        checked={strength === value}
                        onChange={() => setStrength(value)}
                      />
                      <span>{STRENGTHS[value].label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="lens-help">
                {strength === "gentle"
                  ? "A light cleanup for faint details. Start here."
                  : "A little more noise reduction. Compare faint details carefully."}
              </p>
              <button
                type="button"
                className="lens-restore"
                onClick={restore}
                disabled={!input || locked}
              >
                <Sparkles size={16} />
                {busy ? "Restoring…" : result ? "Restore again" : "Restore image"}
              </button>
              {busy && (
                <button type="button" className="lens-cancel" onClick={cancel}>
                  <X size={14} /> Cancel restoration
                </button>
              )}
              <p className="lens-help">
                8-bit previews up to 768 px. Larger files are resized; transparency is shown on
                black. FITS and RAW are not supported in this first version.
              </p>
            </div>
            <div className="lens-status" role="status" aria-live="polite">
              {locked ? (
                <LoaderCircle size={16} className="lens-spinner" />
              ) : result ? (
                <Check size={16} />
              ) : (
                <Focus size={16} />
              )}
              <span>{status}</span>
            </div>
            {busy && <progress value={progress} max={100} aria-label="Restoration progress" />}
            {error && (
              <p className="lens-error" role="alert">
                {error}
              </p>
            )}
          </aside>
          <div className="lens-results" aria-busy={busy}>
            <div className="lens-section-title">
              <div>
                <p className="watch-eyebrow">03 / THE VIEWING ROOM</p>
                <h2>Look a little closer.</h2>
              </div>
              <span>THE ORIGINAL IS YOUR REFERENCE</span>
            </div>
            {input && originalUrl ? (
              <ComparisonView
                original={originalUrl}
                restored={result ? restoredUrl || undefined : undefined}
                width={input.width}
                height={input.height}
                objects={result?.objects ?? []}
                selected={selected}
                onSelect={setSelected}
              />
            ) : (
              <div className="lens-empty">
                <div className="lens-empty-orbit">
                  <Focus size={45} strokeWidth={1} />
                </div>
                <h3>Your sky belongs here.</h3>
                <p>
                  Choose a capture or explore the synthetic demo.
                  <br />
                  Your before-and-after view will open in this space.
                </p>
                <span>OBSERVE · RESTORE · COMPARE</span>
              </div>
            )}
            {result && (
              <>
                <div className="lens-downloads">
                  <button
                    type="button"
                    onClick={() => downloadBlob(result.blob, `spirit-lens-${result.strength}.png`)}
                  >
                    <Download size={15} /> Download restored PNG
                  </button>
                  <button type="button" onClick={downloadReport}>
                    <Download size={15} /> Analysis report
                  </button>
                  <span>
                    {STRENGTHS[result.strength].label} · {(result.elapsedMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <section className="lens-measurements" aria-label="Restoration measurements">
                  <div>
                    <span>INPUT SIMILARITY · SSIM</span>
                    <strong>{result.metrics.ssim.toFixed(3)}</strong>
                  </div>
                  <div>
                    <span>INPUT SIMILARITY · PSNR</span>
                    <strong>
                      {result.metrics.psnr === null
                        ? "Identical"
                        : `${result.metrics.psnr.toFixed(1)} dB`}
                    </strong>
                  </div>
                  <div>
                    <span>ESTIMATED NOISE</span>
                    <strong>
                      {result.metrics.noiseBefore.toFixed(1)} <small>→</small>{" "}
                      {result.metrics.noiseAfter.toFixed(1)}
                    </strong>
                  </div>
                  <div>
                    <span>MAX CHANNEL CHANGE</span>
                    <strong>
                      {result.metrics.maxChannelChange}
                      <small> / 255</small>
                    </strong>
                  </div>
                </section>
                <p className="lens-help">
                  Similarity is measured against the noisy input, not a clean reference. These
                  values describe the edit; they do not prove scientific accuracy.
                </p>
                <section className="lens-detections" aria-label="Detected objects">
                  <div className="lens-section-title">
                    <div>
                      <p className="watch-eyebrow">04 / TRACES OF LIGHT</p>
                      <h2>{result.objects.length} candidate objects.</h2>
                    </div>
                    <Focus size={23} />
                  </div>
                  <p className="lens-help">
                    Measured on the original preview using brightness and shape. Extended sources
                    may be galaxies, nebulae, or blended stars; these are not confirmed
                    identifications. Up to 150 candidates are shown.
                  </p>
                  {result.objects.length > 0 ? (
                    <>
                      <div className="lens-object-list" aria-label="Select a candidate">
                        {result.objects.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected === item.id}
                            onClick={() => setSelected(item.id)}
                          >
                            <span>{String(item.id).padStart(2, "0")}</span>{" "}
                            {item.kind === "star candidate"
                              ? "Star candidate"
                              : item.kind === "galaxy candidate"
                                ? "Galaxy candidate"
                                : "Extended source"}
                          </button>
                        ))}
                      </div>
                      {object && (
                        <div className="lens-object-detail">
                          <h3>
                            Object {object.id} <span>{object.kind}</span>
                          </h3>
                          <dl>
                            <div>
                              <dt>Position</dt>
                              <dd>
                                {object.x.toFixed(1)}, {object.y.toFixed(1)} px
                              </dd>
                            </div>
                            <div>
                              <dt>Detected area</dt>
                              <dd>{object.area} px²</dd>
                            </div>
                            <div>
                              <dt>Peak brightness</dt>
                              <dd>{object.peak.toFixed(1)} / 255</dd>
                            </div>
                            <div>
                              <dt>Relative flux</dt>
                              <dd>{object.flux.toFixed(0)} a.u.</dd>
                            </div>
                            <div>
                              <dt>Ellipticity</dt>
                              <dd>{object.ellipticity.toFixed(2)}</dd>
                            </div>
                            <div>
                              <dt>Peak / noise estimate</dt>
                              <dd>{object.snr.toFixed(1)}×</dd>
                            </div>
                          </dl>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="lens-empty-detections">
                      No sources passed the detection threshold. Diffuse or very faint objects may
                      not be detected.
                    </p>
                  )}
                  <p className="lens-help">
                    Positions and sizes use preview pixels. Brightness is uncalibrated display
                    luminance, not an astronomical magnitude.
                  </p>
                  <p className="lens-help">
                    Galaxy candidates are resolved sources with at least 55 detected pixels,
                    ellipticity ≥0.25, and peak/noise ≥8. This shape heuristic can confuse nebulae
                    or blended stars with galaxies; it is not a learned classifier or a catalogue
                    match.
                  </p>
                </section>
              </>
            )}
          </div>
        </main>
        <details className="lens-method">
          <summary>What happens to my image?</summary>
          <div>
            <p>
              DnCNN estimates noise in luminance. Spirit Lens applies a bounded portion of that
              correction and preserves RGB channel differences. Denoising protects detected source
              regions; optional deblurring protects their cores while allowing bounded wing
              corrections. The same-size result uses no generative filling or upscaling. Faint
              features can still be affected, so compare with your input.
            </p>
            <p>
              This model was trained for Gaussian noise in ordinary photographs. This first version
              provides visual denoising and optional conventional deconvolution, not calibrated
              photometry. Detection uses conventional image analysis. PSNR, windowed SSIM, estimated
              noise, and Laplacian sharpness are included in the report.
            </p>
            <p>
              Processing runs in a worker on this device. Images and results are kept in this tab;
              download them before leaving. The first restoration loads about 17 MB of runtime and
              model files.
            </p>
            <p>
              <a href="https://github.com/cszn/KAIR" target="_blank" rel="noreferrer">
                DnCNN / KAIR model source <ArrowUpRight size={12} />
              </a>
              <a href="/models/dncnn/LICENSE.txt" target="_blank" rel="noreferrer">
                Model license
              </a>
            </p>
          </div>
        </details>
        <footer className="lens-footer">
          <span>TSUKUYOMI WATCH · THE SPIRIT LENS</span>
          <JapaneseText meaning="Light">光</JapaneseText>
        </footer>
      </div>
    </div>
  );
}
