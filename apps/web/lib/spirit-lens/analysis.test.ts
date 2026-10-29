import assert from "node:assert/strict";
import { test } from "node:test";
import { compareMetrics, conservativeBlend, detectObjects, luminance, reflect } from "./analysis";
import { inspectImage } from "./image";

test("reflection handles small images and repeated out-of-bounds positions", () => {
  assert.equal(reflect(-17, 2), 1);
  assert.equal(reflect(256, 1), 0);
  assert.equal(reflect(-1, 30), 1);
});

test("cleanup bounds changes and preserves color, alpha, and detected sources", () => {
  const pixels = new Uint8ClampedArray(32 * 32 * 4);
  for (let i = 0; i < 32 * 32; i++)
    pixels.set([30 + (i % 5), 40 + (i % 5), 50 + (i % 5), 255], 4 * i);
  const values = luminance(pixels).map((value, i) => value + (i % 2 ? 100 : -100));
  const source = {
    id: 1,
    kind: "star candidate" as const,
    x: 16,
    y: 16,
    radius: 4,
    area: 20,
    peak: 50,
    flux: 500,
    ellipticity: 0,
    snr: 10,
  };
  const output = conservativeBlend(pixels, values, 32, 32, "gentle", [source]);
  for (let i = 0; i < 32 * 32; i++) {
    assert.ok(Math.abs(output[i * 4]! - pixels[i * 4]!) <= 6);
    assert.equal(output[i * 4 + 1]! - output[i * 4]!, 10);
    assert.equal(output[i * 4 + 3], 255);
  }
  assert.equal(output[(16 * 32 + 16) * 4], pixels[(16 * 32 + 16) * 4]);
  const metrics = compareMetrics(pixels, pixels, 32, 32);
  assert.equal(metrics.ssim, 1);
  assert.equal(metrics.psnr, null);
  assert.equal(metrics.maxChannelChange, 0);
});

test("detection finds an injected source and rejects a flat sky", () => {
  const values = new Float32Array(96 * 96).fill(20);
  assert.equal(detectObjects(values, 96, 96).length, 0);
  for (let y = 0; y < 96; y++)
    for (let x = 0; x < 96; x++)
      values[y * 96 + x]! += 180 * Math.exp(-((x - 45) ** 2 + (y - 50) ** 2) / 4);
  const objects = detectObjects(values, 96, 96);
  assert.equal(objects.length, 1);
  assert.ok(Math.abs(objects[0]!.x - 45) < 0.1);
  assert.ok(Math.abs(objects[0]!.y - 50) < 0.1);
});

test("image validation rejects invalid and oversized decoded dimensions before decoding", () => {
  assert.throws(() => inspectImage(new Uint8Array(40)), /valid PNG/);
  const header = new Uint8Array(33);
  header.set([137, 80, 78, 71, 13, 10, 26, 10]);
  header.set([73, 72, 68, 82], 12);
  const view = new DataView(header.buffer);
  view.setUint32(16, 16000);
  view.setUint32(20, 16000);
  assert.throws(() => inspectImage(header), /24 megapixels/);
  view.setUint32(16, 100);
  view.setUint32(20, 100);
  header[24] = 16;
  assert.throws(() => inspectImage(header), /16-bit/);
});
test("elongated extended light is exposed as an unconfirmed galaxy candidate", () => {
  const n = 96,
    values = new Float32Array(n * n).fill(20);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      values[y * n + x]! += 120 * Math.exp(-0.5 * (((x - 48) / 8) ** 2 + ((y - 48) / 3) ** 2));
  const objects = detectObjects(values, n, n);
  assert.ok(objects.some((object) => object.kind === "galaxy candidate"));
});
