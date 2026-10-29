import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";

// Render secret files avoid passing credentials in CLI arguments or source control.
const secretFile = "/etc/secrets/runtime.json";
const secrets = existsSync(secretFile) ? JSON.parse(readFileSync(secretFile, "utf8")) : {};
const allowed = [
  "DATABASE_URL",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
];
const env = { ...process.env };
for (const key of allowed) if (typeof secrets[key] === "string") env[key] = secrets[key];
if (!env.DATABASE_URL)
  throw new Error("DATABASE_URL must identify the deployed database before startup.");
env.NODE_ENV = env.NODE_ENV === "production" ? "prod" : env.NODE_ENV || "prod";
env.BASE_URL ||= env.RENDER_EXTERNAL_URL;

let child;
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child?.kill(signal));
async function run(command, args) {
  await new Promise((resolve, reject) => {
    child = spawn(command, args, { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Startup stage failed (${code}).`)),
    );
  });
}
if (process.argv.includes("--check")) console.log("Deployment startup configuration is valid.");
else {
  // Free web services do not support a preDeployCommand. The seed is idempotent.
  await run("pnpm", ["--filter", "@repo/database", "exec", "drizzle-kit", "migrate"]);
  await run("pnpm", ["--filter", "@repo/database", "db:seed"]);
  await run(process.execPath, ["apps/api/dist/index.js"]);
}
