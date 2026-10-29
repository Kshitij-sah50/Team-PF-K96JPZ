import { pgTable, text, timestamp, boolean, uuid, primaryKey } from "drizzle-orm/pg-core";
import { celestialEventsTable } from "./events";

// One row per provider and UTC month; failed attempts are cooled down as well.
export const eventFeedSyncTable = pgTable("event_feed_sync", {
  key: text("key").primaryKey(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull(),
  succeededAt: timestamp("succeeded_at", { withTimezone: true }),
  failed: boolean("failed").notNull().default(false),
  truncated: boolean("truncated").notNull().default(false),
});

// Membership in the latest successful snapshot. Removing a canceled/rescheduled
// launch from a feed must not delete its historical record or attached alerts.
export const eventFeedItemsTable = pgTable(
  "event_feed_items",
  {
    feedKey: text("feed_key")
      .notNull()
      .references(() => eventFeedSyncTable.key, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => celestialEventsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.feedKey, t.eventId] })],
);
