import { STRENGTHS, type LensMetrics, type LensObject, type LensStrength } from "./model";

export function luminance(rgba: Uint8ClampedArray): Float32Array {
  const result = new Float32Array(rgba.length / 4);
  for (let i = 0; i < result.length; i++) {
    result[i] = 0.2126 * rgba[i * 4]! + 0.7152 * rgba[i * 4 + 1]! + 0.0722 * rgba[i * 4 + 2]!;
  }
  return result;
}

export function reflect(index: number, size: number): number {
  if (size <= 1) return 0;
  const period = 2 * (size - 1);
  const folded = ((index % period) + period) % period;
  return folded < size ? folded : period - folded;
}

function smooth(values: Float32Array, width: number, height: number): Float32Array {
  const horizontal = new Float32Array(values.length);
  const output = new Float32Array(values.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] =
        (values[y * width + reflect(x - 1, width)]! +
          2 * values[y * width + x]! +
          values[y * width + reflect(x + 1, width)]!) /
        4;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      output[y * width + x] =
        (horizontal[reflect(y - 1, height) * width + x]! +
          2 * horizontal[y * width + x]! +
          horizontal[reflect(y + 1, height) * width + x]!) /
        4;
    }
  }
  return output;
}

// Robust high-pass MAD estimate in display-luminance units, not sensor noise.
export function estimateNoise(values: Float32Array, width: number, height: number): number {
  const filtered = smooth(values, width, height);
  const residual: number[] = [];
  const step = Math.max(1, Math.floor(values.length / 50000));
  for (let i = 0; i < values.length; i += step) residual.push(Math.abs(values[i]! - filtered[i]!));
  residual.sort((a, b) => a - b);
  return (residual[Math.floor(residual.length / 2)] ?? 0) / (0.67449 * Math.sqrt(0.640625));
}

function background(values: Float32Array, width: number, height: number): Float32Array {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x < width; x++) {
      sum += values[y * width + x]!;
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1]! + sum;
    }
  }
  const result = new Float32Array(values.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - 16),
        right = Math.min(width, x + 17);
      const top = Math.max(0, y - 16),
        bottom = Math.min(height, y + 17);
      result[y * width + x] =
        (integral[bottom * stride + right]! -
          integral[top * stride + right]! -
          integral[bottom * stride + left]! +
          integral[top * stride + left]!) /
        ((right - left) * (bottom - top));
    }
  }
  return result;
}

/** Morphological candidates measured on the input. No catalogue identity is inferred. */
export function detectObjects(values: Float32Array, width: number, height: number): LensObject[] {
  const noise = Math.max(1, estimateNoise(values, width, height));
  const filtered = smooth(values, width, height);
  const sky = background(values, width, height);
  const threshold = Math.max(3, 2 * noise);
  const visited = new Uint8Array(values.length);
  const queue = new Int32Array(values.length);
  const objects: LensObject[] = [];
  for (let seed = 0; seed < values.length; seed++) {
    if (visited[seed] || filtered[seed]! - sky[seed]! < threshold) continue;
    let head = 0,
      tail = 1;
    queue[0] = seed;
    visited[seed] = 1;
    let flux = 0,
      sx = 0,
      sy = 0,
      sxx = 0,
      syy = 0,
      sxy = 0,
      peak = 0,
      peakSignal = 0;
    while (head < tail) {
      const index = queue[head++]!;
      const x = index % width,
        y = Math.floor(index / width);
      const signal = Math.max(0, values[index]! - sky[index]!);
      flux += signal;
      sx += signal * x;
      sy += signal * y;
      sxx += signal * x * x;
      syy += signal * y * y;
      sxy += signal * x * y;
      peak = Math.max(peak, values[index]!);
      peakSignal = Math.max(peakSignal, signal);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighbor = ny * width + nx;
          if (!visited[neighbor] && filtered[neighbor]! - sky[neighbor]! >= threshold) {
            visited[neighbor] = 1;
            queue[tail++] = neighbor;
          }
        }
      }
    }
    if (tail < 3 || tail > values.length * 0.15 || flux === 0 || peakSignal < 4.5 * noise) continue;
    const x = sx / flux,
      y = sy / flux;
    const xx = Math.max(0, sxx / flux - x * x),
      yy = Math.max(0, syy / flux - y * y);
    const xy = sxy / flux - x * y;
    const spread = Math.sqrt((xx - yy) ** 2 + 4 * xy ** 2);
    const major = Math.max(0.01, (xx + yy + spread) / 2);
    const minor = Math.max(0, (xx + yy - spread) / 2);
    let radius = 2;
    for (let i = 0; i < tail; i++) {
      radius = Math.max(
        radius,
        Math.hypot((queue[i]! % width) - x, Math.floor(queue[i]! / width) - y),
      );
    }
    objects.push({
      id: 0,
      kind:
        tail >= 55
          ? 1 - Math.sqrt(minor / major) >= 0.25 && peakSignal / noise >= 8
            ? "galaxy candidate"
            : "extended source"
          : "star candidate",
      x,
      y,
      radius: radius + 2,
      area: tail,
      peak,
      flux,
      ellipticity: 1 - Math.sqrt(minor / major),
      snr: peakSignal / noise,
    });
  }
  return objects
    .sort((a, b) => b.flux - a.flux)
    .slice(0, 150)
    .map((object, index) => ({ ...object, id: index + 1 }));
}

/** Bounded luminance-only residual; preserve alpha, channel differences, and candidate regions. */
export function conservativeBlend(
  original: Uint8ClampedArray,
  restoredLuminance: Float32Array,
  width: number,
  height: number,
  strength: LensStrength,
  objects: LensObject[],
): Uint8ClampedArray<ArrayBuffer> {
  const before = luminance(original);
  const result = new Uint8ClampedArray(original);
  const protectedPixels = new Uint8Array(width * height);
  for (const object of objects) {
    for (
      let y = Math.max(0, Math.floor(object.y - object.radius));
      y <= Math.min(height - 1, Math.ceil(object.y + object.radius));
      y++
    ) {
      for (
        let x = Math.max(0, Math.floor(object.x - object.radius));
        x <= Math.min(width - 1, Math.ceil(object.x + object.radius));
        x++
      ) {
        if (Math.hypot(x - object.x, y - object.y) <= object.radius)
          protectedPixels[y * width + x] = 1;
      }
    }
  }
  const { blend, maxDelta } = STRENGTHS[strength];
  for (let i = 0; i < before.length; i++) {
    if (protectedPixels[i] || original[4 * i + 3] !== 255) continue;
    if (!Number.isFinite(restoredLuminance[i]))
      throw new Error("The denoiser returned invalid pixels.");
    let delta = Math.max(
      -maxDelta,
      Math.min(maxDelta, (restoredLuminance[i]! - before[i]!) * blend),
    );
    // Clamp the correction to the input neighborhood's range (no new local extrema).
    const x = i % width,
      y = Math.floor(i / width);
    let low = before[i]!,
      high = before[i]!;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const value = before[reflect(y + dy, height) * width + reflect(x + dx, width)]!;
        low = Math.min(low, value);
        high = Math.max(high, value);
      }
    }
    const r = original[4 * i]!,
      g = original[4 * i + 1]!,
      b = original[4 * i + 2]!;
    delta = Math.max(
      low - before[i]!,
      -Math.min(r, g, b),
      Math.min(high - before[i]!, 255 - Math.max(r, g, b), delta),
    );
    // An integer common offset keeps RGB channel differences exactly unchanged.
    const offset = Math.round(delta);
    result[4 * i] = r + offset;
    result[4 * i + 1] = g + offset;
    result[4 * i + 2] = b + offset;
  }
  return result;
}

function sharpness(values: Float32Array, width: number, height: number): number {
  let sum = 0,
    sum2 = 0,
    count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        values[i - width]! + values[i + width]! + values[i - 1]! + values[i + 1]! - 4 * values[i]!;
      sum += lap;
      sum2 += lap * lap;
      count++;
    }
  }
  return count ? Math.max(0, sum2 / count - (sum / count) ** 2) : 0;
}

export function compareMetrics(
  original: Uint8ClampedArray,
  result: Uint8ClampedArray,
  width: number,
  height: number,
): LensMetrics {
  const a = luminance(original),
    b = luminance(result);
  let squared = 0,
    absolute = 0,
    maxChannelChange = 0;
  for (let i = 0; i < original.length; i++) {
    if (i % 4 === 3) continue;
    const difference = Math.abs(original[i]! - result[i]!);
    squared += difference ** 2;
    absolute += difference;
    maxChannelChange = Math.max(maxChannelChange, difference);
  }
  let similarity = 0,
    windows = 0;
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      let sa = 0,
        sb = 0,
        saa = 0,
        sbb = 0,
        sab = 0,
        n = 0;
      for (let dy = 0; dy < Math.min(8, height - y); dy++) {
        for (let dx = 0; dx < Math.min(8, width - x); dx++) {
          const i = (y + dy) * width + x + dx,
            va = a[i]!,
            vb = b[i]!;
          sa += va;
          sb += vb;
          saa += va * va;
          sbb += vb * vb;
          sab += va * vb;
          n++;
        }
      }
      const ma = sa / n,
        mb = sb / n;
      const va = Math.max(0, saa / n - ma ** 2),
        vb = Math.max(0, sbb / n - mb ** 2),
        covariance = sab / n - ma * mb;
      similarity +=
        ((2 * ma * mb + 6.5025) * (2 * covariance + 58.5225)) /
        ((ma ** 2 + mb ** 2 + 6.5025) * (va + vb + 58.5225));
      windows++;
    }
  }
  const mse = squared / (a.length * 3);
  return {
    psnr: mse === 0 ? null : 10 * Math.log10(255 ** 2 / mse),
    ssim: similarity / windows,
    noiseBefore: estimateNoise(a, width, height),
    noiseAfter: estimateNoise(b, width, height),
    sharpnessBefore: sharpness(a, width, height),
    sharpnessAfter: sharpness(b, width, height),
    meanAbsoluteChange: absolute / (a.length * 3),
    maxChannelChange,
  };
}
