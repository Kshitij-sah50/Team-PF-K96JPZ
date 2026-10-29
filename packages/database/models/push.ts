import { pgTable, uuid, text, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";
export const pushDevicesTable = pgTable("push_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  endpointHash: text("endpoint_hash").notNull().unique(),
  subscription: jsonb("subscription")
    .$type<{ endpoint: string; keys: { p256dh: string; auth: string } }>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const pushJobsTable = pgTable(
  "push_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => pushDevicesTable.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    claimedUntil: timestamp("claimed_until", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
  },
  (t) => [index("push_jobs_due_idx").on(t.sentAt, t.dueAt)],
);
