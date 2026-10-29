const webpush = require("web-push");
const { randomBytes } = require("node:crypto");
const { appendFileSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const target = resolve(__dirname, "../../../.env");
const existing = readFileSync(target, "utf8");
if (/^VAPID_PRIVATE_KEY=/m.test(existing))
  throw new Error("Push credentials already exist; refusing to replace them.");
const keys = webpush.generateVAPIDKeys();
appendFileSync(
  target,
  `\n# Background push (keep private values on the server)\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_SUBJECT=https://github.com/PECathon-2026/Team-PF-K96JPZ\nCRON_SECRET=${randomBytes(32).toString("hex")}\n`,
);
console.log("Push credentials saved in the ignored root .env. Restart the API to load them.");
