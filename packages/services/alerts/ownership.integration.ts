import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { db, eq } from "@repo/database";
import { pushDevicesTable, pushJobsTable } from "@repo/database/schema";
import { registerPush, listPush, cancelPush, removePush } from "./index";
test("device tokens isolate persisted jobs and removal cascades", async () => {
  const make = () =>
    registerPush({
      endpoint: `https://fcm.googleapis.com/fcm/send/test-${randomUUID()}`,
      keys: { auth: "test-only-not-deliverable", p256dh: "test-only-not-deliverable" },
    });
  const a = await make(),
    b = await make();
  try {
    const [device] = await db
      .select()
      .from(pushDevicesTable)
      .where(eq(pushDevicesTable.tokenHash, createHash("sha256").update(a.token).digest("hex")));
    const marker = randomUUID();
    const [job] = await db
      .insert(pushJobsTable)
      .values({
        deviceId: device!.id,
        key: marker,
        title: "Integration fixture",
        body: "Not for delivery",
        url: "/",
        dueAt: new Date(Date.now() + 86400000),
        expiresAt: new Date(Date.now() + 2 * 86400000),
      })
      .returning();
    assert.ok(job);
    const ownerA = (await listPush(a.token)).some((j) => j.id === job.id);
    const owner = ownerA ? a : b,
      other = ownerA ? b : a;
    await cancelPush(other.token, job.id);
    assert.ok((await listPush(owner.token)).some((j) => j.id === job.id));
    await removePush(owner.token);
    assert.equal(
      (await db.select().from(pushJobsTable).where(eq(pushJobsTable.id, job.id))).length,
      0,
    );
  } finally {
    await removePush(a.token);
    await removePush(b.token);
    await db.$client.end();
  }
});
