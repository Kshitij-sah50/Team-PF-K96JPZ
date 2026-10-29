import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const target = new URL("../public/onnx/", import.meta.url);
await mkdir(target, { recursive: true });
for (const file of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  await copyFile(require.resolve(`onnxruntime-web/${file}`), new URL(file, target));
}
