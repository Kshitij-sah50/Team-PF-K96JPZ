import { reflect } from "./analysis";
export function gaussianBlur(input: Float32Array, width: number, height: number, sigma = 1.1) {
  const radius = Math.ceil(3 * sigma),
    kernel = Array.from({ length: 2 * radius + 1 }, (_, i) =>
      Math.exp(-0.5 * ((i - radius) / sigma) ** 2),
    );
  const sum = kernel.reduce((a, b) => a + b, 0);
  const temp = new Float32Array(input.length),
    out = new Float32Array(input.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let d = -radius; d <= radius; d++)
        value += (input[y * width + reflect(x + d, width)]! * kernel[d + radius]!) / sum;
      temp[y * width + x] = value;
    }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let d = -radius; d <= radius; d++)
        value += (temp[reflect(y + d, height) * width + x]! * kernel[d + radius]!) / sum;
      out[y * width + x] = value;
    }
  return out;
}
/** Six non-generative Richardson–Lucy iterations with a modest Gaussian PSF. */
export function deconvolve(input: Float32Array, width: number, height: number, sigma = 1.1) {
  if (!Number.isFinite(sigma) || sigma < 0.5 || sigma > 2)
    throw new Error("Choose a blur radius between 0.5 and 2 pixels.");
  let estimate = Float32Array.from(input, (value) => Math.max(0.001, value));
  for (let iteration = 0; iteration < 6; iteration++) {
    const blurred = gaussianBlur(estimate, width, height, sigma);
    const ratio = Float32Array.from(
      input,
      (value, index) => Math.max(0, value) / Math.max(0.001, blurred[index]!),
    );
    const correction = gaussianBlur(ratio, width, height, sigma);
    estimate = Float32Array.from(estimate, (value, index) =>
      Math.min(255, Math.max(0, value * correction[index]!)),
    );
  }
  return estimate;
}
