import { MAX_FILE_BYTES, MAX_INPUT_PIXELS, MAX_PROCESSING_EDGE } from "./model";

export type LensInput = {
  name: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  pixels: Uint8ClampedArray<ArrayBuffer>;
  preview: Blob;
  fileHash: string;
  synthetic: boolean;
};

export function inspectImage(bytes: Uint8Array): { width: number; height: number; mime: string } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));
  let width = 0,
    height = 0,
    mime = "";
  if (
    bytes.length >= 33 &&
    bytes[0] === 137 &&
    ascii(1, 7) === "PNG\r\n\x1a\n" &&
    ascii(12, 4) === "IHDR"
  ) {
    if (bytes[24] === 16)
      throw new Error(
        "Please export an 8-bit PNG for this preview. 16-bit scientific images are not supported yet.",
      );
    width = view.getUint32(16);
    height = view.getUint32(20);
    mime = "image/png";
  } else if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    mime = "image/webp";
    const chunk = ascii(12, 4);
    if (chunk === "VP8X") {
      if (bytes[20]! & 2) throw new Error("Choose a still image. Animated WebP is not supported.");
      width = 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16);
      height = 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16);
    } else if (chunk === "VP8 " && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) {
      width = view.getUint16(26, true) & 0x3fff;
      height = view.getUint16(28, true) & 0x3fff;
    } else if (chunk === "VP8L" && bytes[20] === 47) {
      const bits = view.getUint32(21, true);
      width = (bits & 0x3fff) + 1;
      height = ((bits >>> 14) & 0x3fff) + 1;
    }
  } else if (bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216) {
    mime = "image/jpeg";
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++]!;
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([192, 193, 194].includes(marker) && length >= 8) {
        if (bytes[offset + 2] !== 8) throw new Error("Please use an 8-bit JPEG.");
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  }
  if (!width || !height)
    throw new Error(
      "Choose a valid PNG, JPEG, or WebP image. FITS and RAW support will follow later.",
    );
  if (width < 16 || height < 16) throw new Error("The image must be at least 16 × 16 pixels.");
  if (width * height > MAX_INPUT_PIXELS || Math.max(width, height) > 12000) {
    throw new Error("Choose an image up to 24 megapixels and 12,000 pixels per side.");
  }
  return { width, height, mime };
}

export async function pixelsToBlob(
  pixels: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image previews are unavailable in this browser.");
  context.putImageData(new ImageData(pixels, width, height), 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export the image."))),
      "image/png",
    ),
  );
}

export async function decodeImageFile(file: File): Promise<LensInput> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Choose a file smaller than 12 MB.");
  const bytes = await file.arrayBuffer();
  const header = inspectImage(new Uint8Array(bytes));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const fileHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes], { type: header.mime }), {
      imageOrientation: "from-image",
    });
  } catch {
    throw new Error("This image could not be decoded. Try exporting it again as PNG or JPEG.");
  }
  try {
    const originalWidth = bitmap.width,
      originalHeight = bitmap.height;
    if (originalWidth * originalHeight > MAX_INPUT_PIXELS)
      throw new Error("The decoded image exceeds the 24-megapixel limit.");
    const scale = Math.min(1, MAX_PROCESSING_EDGE / Math.max(originalWidth, originalHeight));
    const width = Math.round(originalWidth * scale),
      height = Math.round(originalHeight * scale);
    if (Math.min(width, height) < 16)
      throw new Error(
        "The image is too narrow for a restoration preview. Choose a less extreme aspect ratio.",
      );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image previews are unavailable in this browser.");
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    return {
      name: file.name,
      width,
      height,
      originalWidth,
      originalHeight,
      pixels,
      fileHash,
      synthetic: false,
      preview: await pixelsToBlob(pixels, width, height),
    };
  } finally {
    bitmap.close();
  }
}

/** An explicitly synthetic fixture for exploring the interface, not an observation. */
export async function syntheticImage(): Promise<LensInput> {
  const width = 444,
    height = 330;
  let seed = 476;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed + 1) / 4294967297;
  };
  const sources = Array.from({ length: 45 }, () => ({
    x: 15 + random() * (width - 30),
    y: 15 + random() * (height - 30),
    radius: 0.8 + random() * 1.4,
    amplitude: 70 + random() * 150,
  }));
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const noise = 9 * Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
      const gx = (x - width * 0.65) * 0.8 + (y - height * 0.6) * 0.6;
      const gy = -(x - width * 0.65) * 0.6 + (y - height * 0.6) * 0.8;
      let value = 22 + noise + 120 * Math.exp(-0.5 * ((gx / 17) ** 2 + (gy / 6) ** 2));
      for (const source of sources)
        value +=
          source.amplitude *
          Math.exp(-((x - source.x) ** 2 + (y - source.y) ** 2) / (2 * source.radius ** 2));
      const index = (y * width + x) * 4;
      pixels[index] = value * 0.9;
      pixels[index + 1] = value * 0.96;
      pixels[index + 2] = value;
      pixels[index + 3] = 255;
    }
  }
  return {
    name: "Synthetic star field",
    width,
    height,
    originalWidth: width,
    originalHeight: height,
    pixels,
    preview: await pixelsToBlob(pixels, width, height),
    fileHash: "synthetic-demo-v1",
    synthetic: true,
  };
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
