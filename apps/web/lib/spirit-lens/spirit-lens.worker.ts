import * as ort from "onnxruntime-web/wasm";
import { compareMetrics, conservativeBlend, detectObjects, luminance, reflect } from "./analysis";
import {
  LENS_MODEL,
  MAX_PROCESSING_EDGE,
  STRENGTHS,
  type LensRequest,
  type LensResponse,
} from "./model";

const worker = globalThis as unknown as {
  onmessage: (event: MessageEvent<LensRequest>) => void;
  postMessage: (message: LensResponse, transfer?: Transferable[]) => void;
};

async function verifiedAsset(
  asset: { url: string; sha256: string },
  origin: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(new URL(asset.url, origin));
  if (!response.ok) throw new Error("The restoration model could not be loaded. Please try again.");
  const buffer = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== asset.sha256)
    throw new Error("Model verification failed. Reload the page and try again.");
  return new Uint8Array(buffer);
}

worker.onmessage = async ({ data }) => {
  let session: ort.InferenceSession | undefined;
  const started = performance.now();
  const progress = (message: string, value: number) =>
    worker.postMessage({ type: "progress", message, progress: value });
  try {
    const { width, height, strength } = data;
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 16 ||
      height < 16 ||
      width > MAX_PROCESSING_EDGE ||
      height > MAX_PROCESSING_EDGE ||
      data.pixels.byteLength !== width * height * 4 ||
      !Object.hasOwn(STRENGTHS, strength)
    )
      throw new Error("Invalid image or restoration settings.");
    const original = new Uint8ClampedArray(data.pixels);
    const input = luminance(original);
    progress("Finding candidate objects in the original…", 4);
    const objects = detectObjects(input, width, height);
    progress("Loading and verifying the AI model…", 8);
    const [graph, weights] = await Promise.all([
      verifiedAsset(LENS_MODEL.graph, data.origin),
      verifiedAsset(LENS_MODEL.weights, data.origin),
    ]);
    ort.env.wasm.wasmPaths = new URL("/onnx/", data.origin).href;
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    session = await ort.InferenceSession.create(graph, {
      executionProviders: ["wasm"],
      externalData: [{ path: "dncnn.data", data: weights }],
      graphOptimizationLevel: "all",
    });
    const { tile, halo } = LENS_MODEL;
    const core = tile - 2 * halo;
    const total = Math.ceil(width / core) * Math.ceil(height / core);
    const output = new Float32Array(input.length);
    let completed = 0;
    for (let top = 0; top < height; top += core) {
      for (let left = 0; left < width; left += core) {
        progress(
          `Restoring image region ${completed + 1} of ${total}…`,
          15 + (75 * completed) / total,
        );
        const region = new Float32Array(tile * tile);
        for (let y = 0; y < tile; y++) {
          for (let x = 0; x < tile; x++) {
            region[y * tile + x] =
              input[reflect(top + y - halo, height) * width + reflect(left + x - halo, width)]! /
              255;
          }
        }
        const tensor = new ort.Tensor("float32", region, [1, 1, tile, tile]);
        const result = await session.run({ image: tensor });
        const restored = result.denoised_image;
        if (!restored || restored.data.length !== tile * tile)
          throw new Error("Unexpected denoiser output.");
        const values = restored.data as Float32Array;
        for (let y = 0; y < Math.min(core, height - top); y++) {
          for (let x = 0; x < Math.min(core, width - left); x++) {
            output[(top + y) * width + left + x] = values[(y + halo) * tile + x + halo]! * 255;
          }
        }
        tensor.dispose();
        for (const value of Object.values(result)) value.dispose();
        completed++;
      }
    }
    progress("Preserving source regions and measuring changes…", 94);
    const pixels = conservativeBlend(original, output, width, height, strength, objects);
    const metrics = compareMetrics(original, pixels, width, height);
    worker.postMessage(
      {
        type: "result",
        pixels: pixels.buffer,
        objects,
        metrics,
        elapsedMs: performance.now() - started,
      },
      [pixels.buffer],
    );
  } catch (error) {
    worker.postMessage({
      type: "error",
      message:
        error instanceof Error &&
        !error.message.includes("wasm") &&
        !error.message.includes("backend")
          ? error.message
          : "The AI engine could not start in this browser. Try a recent Chrome, Edge, Firefox, or Safari, then retry.",
    });
  } finally {
    await session?.release();
  }
};
