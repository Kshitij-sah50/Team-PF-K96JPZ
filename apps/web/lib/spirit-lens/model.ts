export const LENS_MODEL = {
  name: "DnCNN",
  version: "sigma25 / Qualcomm export v0.65.0",
  tile: 256,
  // A 17-layer 3x3 CNN has a receptive-field radius of 17 pixels.
  halo: 17,
  graph: {
    url: "/models/dncnn/dncnn.onnx",
    sha256: "8737c82a848de49a3bff3456e61d1acef6f10238be1dddbdaf65279abfb060ee",
  },
  weights: {
    url: "/models/dncnn/dncnn.data",
    sha256: "025034640eec75077202afb8bc12d96a2ed406ae09fd8833503700031e096406",
  },
} as const;

export const MAX_FILE_BYTES = 12 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 24_000_000;
export const MAX_PROCESSING_EDGE = 768;

export type LensStrength = "gentle" | "balanced";
export const STRENGTHS = {
  gentle: { label: "Gentle", blend: 0.25, maxDelta: 6 },
  balanced: { label: "Balanced", blend: 0.45, maxDelta: 12 },
} as const;

export type LensObject = {
  id: number;
  kind: "star candidate" | "extended source";
  x: number;
  y: number;
  radius: number;
  area: number;
  peak: number;
  flux: number;
  ellipticity: number;
  snr: number;
};

export type LensMetrics = {
  psnr: number | null;
  ssim: number;
  noiseBefore: number;
  noiseAfter: number;
  sharpnessBefore: number;
  sharpnessAfter: number;
  meanAbsoluteChange: number;
  maxChannelChange: number;
};

export type LensRequest = {
  origin: string;
  pixels: ArrayBuffer;
  width: number;
  height: number;
  strength: LensStrength;
};

export type LensResponse =
  | { type: "progress"; message: string; progress: number }
  | { type: "error"; message: string }
  | {
      type: "result";
      pixels: ArrayBuffer;
      objects: LensObject[];
      metrics: LensMetrics;
      elapsedMs: number;
    };
