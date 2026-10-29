// Run every minute on your scheduler. Secrets come from environment variables.
const origin = process.env.API_URL;
const secret = process.env.CRON_SECRET;
if (!origin || !secret)
  throw new Error("Set API_URL and CRON_SECRET in the scheduler environment.");
const url = new URL("/trpc/push.deliver", origin);
async function run() {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Alert delivery failed (${response.status}).`);
  console.log("Alert scheduler completed.");
}
if (process.argv.includes("--watch")) {
  const check = () =>
    run().catch(() => console.error("Alert scheduler failed; retrying next minute."));
  await check();
  setInterval(check, 60000);
} else await run();
