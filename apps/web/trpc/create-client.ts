import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  return c({
    // Browser calls stay on the web origin so local ports and CORS cannot drift.
    // Server callers need an absolute URL because Node fetch has no page origin.
    url:
      typeof window === "undefined"
        ? `${(process.env.API_URL || "http://localhost:8000").replace(/\/$/, "")}/trpc`
        : "/trpc",
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
