import { NextRequest } from "next/server";
import { z } from "zod";
import { get } from "node:https";

function download(url: URL): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const request = get(url, { family: 4 }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error("SkyView is unavailable."));
        return;
      }
      const chunks: Buffer[] = [];
      let length = 0;
      response.on("data", (chunk: Buffer) => {
        length += chunk.length;
        if (length > 4 * 1024 * 1024) {
          response.destroy(new Error("Response too large."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    });
    const timer = setTimeout(() => request.destroy(new Error("SkyView timed out.")), 45000);
    request.on("error", reject);
    request.on("close", () => clearTimeout(timer));
  });
}

export const runtime = "nodejs";
export const maxDuration = 60;
const query = z.object({
  target: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9 +.,:_-]+$/),
  survey: z.enum(["DSS", "2MASS-J", "GALEX Near UV"]),
  size: z.coerce.number().min(0.05).max(2),
});
const cache = new Map<string, { bytes: Uint8Array<ArrayBuffer>; expires: number }>();
const pending = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();

export async function GET(request: NextRequest) {
  const input = query.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!input.success)
    return Response.json(
      { error: "Choose a valid target, survey, and field size (0.05–2 degrees)." },
      { status: 400 },
    );
  const { target, survey, size } = input.data;
  const url = new URL("https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl");
  url.search = new URLSearchParams({
    Position: target,
    Survey: survey,
    Size: String(size),
    Pixels: "512",
    Return: "JPEG",
  }).toString();
  const key = url.href;
  try {
    let bytes = cache.get(key);
    if (!bytes || bytes.expires < Date.now()) {
      let job = pending.get(key);
      if (!job) {
        if (pending.size >= 3)
          return Response.json(
            { error: "The telescope importer is busy. Try again shortly." },
            { status: 429 },
          );
        job = (async () => {
          const result = await download(url);
          if (result[0] !== 255 || result[1] !== 216)
            throw new Error("No image was returned for this target and survey.");
          if (cache.size >= 20) cache.delete(cache.keys().next().value!);
          cache.set(key, { bytes: result, expires: Date.now() + 6 * 3600000 });
          return result;
        })();
        pending.set(key, job);
        void job.finally(() => pending.delete(key)).catch(() => {});
      }
      bytes = { bytes: await job, expires: 0 };
    }
    return new Response(bytes.bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "X-SkyView-Source": url.href,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "SkyView could not return this field. Check the target name, try DSS, or retry later.",
      },
      { status: 502 },
    );
  }
}
