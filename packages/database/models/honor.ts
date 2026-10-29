import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  check,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";
import { celestialEventsTable } from "./events";

export const userPreferencesTable = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    theme: text("theme", { enum: ["day", "night"] })
      .notNull()
      .default("night"),
    alertLeadMinutes: integer("alert_lead_minutes").notNull().default(30),
    notifyEmail: boolean("notify_email").notNull().default(false),
    defaultRadiusKm: integer("default_radius_km").notNull().default(100),
  },
  (t) => [
    check(
      "preferences_valid",
      sql`${t.theme} in ('day','night') and ${t.alertLeadMinutes} >= 0 and ${t.defaultRadiusKm} > 0`,
    ),
  ],
);

export const honorLedgerTable = pgTable(
  "honor_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    eventId: uuid("event_id").references(() => celestialEventsTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("honor_user_created_idx").on(t.userId, t.createdAt)],
);

export const badgesTable = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description").notNull(),
    pointsRequired: integer("points_required").notNull(),
  },
  (t) => [check("badge_points_valid", sql`${t.pointsRequired} >= 0`)],
);

export const userBadgesTable = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badgesTable.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);
