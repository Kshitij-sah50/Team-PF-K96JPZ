import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePushEndpoint, deliverPush } from "./index";
test("push endpoints reject local networks and arbitrary upstreams", () => {
  assert.doesNotThrow(() => validatePushEndpoint("https://fcm.googleapis.com/fcm/send/test"));
  for (const url of [
    "http://localhost/push",
    "https://127.0.0.1/push",
    "https://example.com/push",
    "https://user@fcm.googleapis.com/push",
    "https://fcm.googleapis.com:444/push",
  ])
    assert.throws(() => validatePushEndpoint(url));
});
test("delivery requires scheduler credentials before looking up devices", async () => {
  await assert.rejects(deliverPush("invalid"), /scheduler credentials/);
});
