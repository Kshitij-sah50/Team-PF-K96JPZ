export type Sample = { x: number; flux: number; error: number };
export type AnalysisMode = "time" | "spectrum";
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};
export function parseSamples(csv: string, mode: AnalysisMode): Sample[] {
  if (csv.length > 1000000) throw new Error("CSV must be smaller than 1 MB.");
  const lines = csv
    .trim()
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  const expected = mode === "time" ? "time_utc" : "wavelength_nm";
  const columns = lines
    .shift()
    ?.trim()
    .split(",")
    .map((value) => value.trim());
  if (
    !columns ||
    columns[0] !== expected ||
    columns[1] !== "flux" ||
    columns.length > 3 ||
    (columns.length === 3 && columns[2] !== "error")
  )
    throw new Error(`Use CSV headers ${expected},flux,error (error is optional).`);
  if (lines.length < 12 || lines.length > 2000) throw new Error("Provide 12–2,000 samples.");
  const samples = lines
    .map((line, index) => {
      const fields = line.split(",").map((value) => value.trim());
      if (fields.length !== columns.length || fields.some((value) => value === ""))
        throw new Error(`Missing or extra value on row ${index + 2}.`);
      if (mode === "time" && !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(fields[0]!))
        throw new Error(
          "Times must be ISO timestamps with an explicit timezone, such as 2026-10-30T20:00:00Z.",
        );
      const x = mode === "time" ? Date.parse(fields[0]!) : Number(fields[0]);
      const flux = Number(fields[1]),
        error = fields[2] === undefined ? 0 : Number(fields[2]);
      if (![x, flux, error].every(Number.isFinite) || error < 0 || (mode === "spectrum" && x <= 0))
        throw new Error(`Invalid numeric value on row ${index + 2}.`);
      return { x, flux, error };
    })
    .sort((a, b) => a.x - b.x);
  if (samples.some((sample, index) => index > 0 && sample.x === samples[index - 1]!.x))
    throw new Error("Duplicate timestamps or wavelengths must be combined before analysis.");
  return samples;
}
export function analyzeSamples(samples: Sample[], mode: AnalysisMode, threshold = 5) {
  if (samples.length < 12 || samples.length > 2000 || threshold < 3 || threshold > 10)
    throw new Error("Invalid analysis settings.");
  const global = median(samples.map((sample) => sample.flux));
  const baselines = samples.map((_, index) =>
    mode === "time"
      ? global
      : median(
          samples
            .slice(Math.max(0, index - 5), Math.min(samples.length, index + 6))
            .filter((_, local) => Math.max(0, index - 5) + local !== index)
            .map((sample) => sample.flux),
        ),
  );
  const residual = samples.map((sample, index) => sample.flux - baselines[index]!);
  const center = median(residual);
  const scatter = 1.4826 * median(residual.map((value) => Math.abs(value - center)));
  const points = samples.map((sample, index) => {
    const uncertainty = Math.hypot(scatter, sample.error);
    const deviation = residual[index]! - center;
    const score = uncertainty > 0 ? deviation / uncertainty : null;
    return {
      ...sample,
      baseline: baselines[index]!,
      score,
      candidate: score !== null && Math.abs(score) >= threshold,
    };
  });
  return {
    mode,
    threshold,
    baseline: global,
    scatter,
    points,
    candidates: points.filter((point) => point.candidate),
    insufficientNoise: points.some((point) => point.score === null),
  };
}
