import { test } from "node:test";
import assert from "node:assert/strict";
import { gaussianBlur, deconvolve } from "./deblur";
test("deconvolution reduces error on a known blurred source", () => {
  const n = 64,
    source = new Float32Array(n * n).fill(10);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      source[y * n + x]! += 160 * Math.exp(-((x - 32) ** 2 + (y - 32) ** 2) / 8);
  const blur = gaussianBlur(source, n, n, 1.1),
    restored = deconvolve(blur, n, n, 1.1);
  const error = (values: Float32Array) =>
    values.reduce((sum, value, index) => sum + (value - source[index]!) ** 2, 0);
  assert.ok(error(restored) < error(blur));
  assert.ok(restored.every((value) => Number.isFinite(value) && value >= 0 && value <= 255));
  assert.throws(() => deconvolve(blur, n, n, 8), /blur radius/);
});
