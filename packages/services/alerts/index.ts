import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import webpush from "web-push";
import { db, eq, and, gt, lte, isNull, or, lt, sql } from "@repo/database";
import {
  pushDevicesTable as devices,
  pushJobsTable as jobs,
  celestialEventsTable as events,
  locationsTable,
} from "@repo/database/schema";
import { getMoonConditions } from "../watchtower/moon";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function pushConfig() {
  return {
    enabled: !!(
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.CRON_SECRET &&
      process.env.VAPID_SUBJECT
    ),
    publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  };
}
export function validatePushEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    (url.hostname !== "fcm.googleapis.com" &&
      url.hostname !== "updates.push.services.mozilla.com" &&
      !/^[a-z0-9-]+\.notify\.windows\.com$/.test(url.hostname))
  )
    throw new Error("Unsupported browser push endpoint.");
}
export async function registerPush(subscription: {
  endpoint: string;
  keys: { auth: string; p256dh: string };
}) {
  if (!pushConfig().enabled) throw new Error("Background push is not configured on the server.");
  validatePushEndpoint(subscription.endpoint);
  const token = randomBytes(32).toString("base64url");
  const [device] = await db
    .insert(devices)
    .values({ tokenHash: hash(token), endpointHash: hash(subscription.endpoint), subscription })
    .onConflictDoNothing()
    .returning({ id: devices.id });
  if (!device)
    throw new Error(
      "This subscription is already registered. Disable and re-enable notifications to reconnect.",
    );
  return { token };
}
async function deviceFor(token: string) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.tokenHash, hash(token)))
    .limit(1);
  if (!device) throw new Error("Notification device not found. Enable notifications again.");
  return device;
}
export async function listPush(token: string) {
  const device = await deviceFor(token);
  return db
    .select({ id: jobs.id, title: jobs.title, dueAt: jobs.dueAt })
    .from(jobs)
    .where(and(eq(jobs.deviceId, device.id), isNull(jobs.sentAt), gt(jobs.expiresAt, new Date())))
    .limit(20);
}
export async function removePush(token: string) {
  await db.delete(devices).where(eq(devices.tokenHash, hash(token)));
  return { removed: true };
}
export async function cancelPush(token: string, id: string) {
  const device = await deviceFor(token);
  await db.delete(jobs).where(and(eq(jobs.id, id), eq(jobs.deviceId, device.id)));
  return { removed: true };
}
export async function schedulePush(input: {
  token: string;
  eventId?: string;
  locationId?: string;
  lead: number;
}) {
  const device = await deviceFor(input.token);
  let start: Date, title: string, body: string, url: string, key: string;
  if (input.eventId) {
    const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
    if (!event) throw new Error("Event not found.");
    start = event.startUtc;
    title = event.title;
    body = `Begins at ${start.toISOString()} (UTC).`;
    url = `/events/${event.id}`;
    key = `event:${event.id}`;
  } else if (input.locationId) {
    const moon = await getMoonConditions(input.locationId);
    const rise = moon?.rises.find((date) => date.getTime() > Date.now() + input.lead * 60000);
    if (!rise) throw new Error("No upcoming moonrise is available for this lead time.");
    const [location] = await db
      .select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.locationId))
      .limit(1);
    start = rise;
    title = "The Moon Rises";
    body = `${location?.name ?? "Your destination"} · ${rise.toISOString()} (UTC).`;
    url = "/#watchtower";
    key = `moon:${input.locationId}:${rise.toISOString()}`;
  } else throw new Error("Choose an event or moonrise location.");
  const dueAt = new Date(start.getTime() - input.lead * 60000);
  if (dueAt.getTime() <= Date.now() || dueAt.getTime() > Date.now() + 366 * 86400000)
    throw new Error("Choose a future alert within the next year.");
  await db.transaction(async (tx) => {
    await tx
      .select({ id: devices.id })
      .from(devices)
      .where(eq(devices.id, device.id))
      .for("update");
    const existing = await tx
      .select({ id: jobs.id, key: jobs.key })
      .from(jobs)
      .where(
        and(eq(jobs.deviceId, device.id), isNull(jobs.sentAt), gt(jobs.expiresAt, new Date())),
      );
    if (existing.some((job) => job.key === key))
      throw new Error("This alert is already scheduled.");
    if (existing.length >= 20) throw new Error("Cancel an alert before adding more than 20.");
    await tx
      .insert(jobs)
      .values({
        deviceId: device.id,
        key,
        title,
        body,
        url,
        dueAt,
        expiresAt: new Date(start.getTime() + 3600000),
      });
  });
  return { scheduled: true };
}
export async function deliverPush(secret: string) {
  const expected = process.env.CRON_SECRET;
  if (
    !expected ||
    secret.length !== expected.length ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  )
    throw new Error("Invalid scheduler credentials.");
  if (!pushConfig().enabled) throw new Error("Background push is not configured.");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const now = new Date();
  const batch = await db.transaction(async (tx) => {
    const due = await tx
      .select()
      .from(jobs)
      .where(
        and(
          isNull(jobs.sentAt),
          lte(jobs.dueAt, now),
          gt(jobs.expiresAt, now),
          lt(jobs.attempts, 3),
          or(isNull(jobs.claimedUntil), lte(jobs.claimedUntil, now)),
        ),
      )
      .limit(10)
      .for("update", { skipLocked: true });
    for (const job of due)
      await tx
        .update(jobs)
        .set({ claimedUntil: new Date(Date.now() + 120000), attempts: sql`${jobs.attempts}+1` })
        .where(eq(jobs.id, job.id));
    return due;
  });
  let sent = 0;
  for (const job of batch) {
    const [device] = await db.select().from(devices).where(eq(devices.id, job.deviceId)).limit(1);
    if (!device) continue;
    try {
      validatePushEndpoint(device.subscription.endpoint);
      await webpush.sendNotification(
        device.subscription,
        JSON.stringify({ title: job.title, body: job.body, url: job.url, tag: job.id }),
        { TTL: 3600, timeout: 5000 },
      );
      await db.update(jobs).set({ sentAt: new Date() }).where(eq(jobs.id, job.id));
      sent++;
    } catch (cause) {
      const status = (cause as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        await db.delete(devices).where(eq(devices.id, device.id));
    }
  }
  await db.delete(jobs).where(lt(jobs.expiresAt, new Date(Date.now() - 7 * 86400000)));
  return { checked: batch.length, sent };
}
