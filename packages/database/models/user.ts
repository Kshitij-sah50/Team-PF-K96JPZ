import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  doublePrecision,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fullName: varchar("full_name", { length: 80 }).notNull(),

    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false),

    profileImageUrl: text("profile_image_url"),
    username: varchar("username", { length: 80 }).unique(),
    homeLat: doublePrecision("home_lat"),
    homeLng: doublePrecision("home_lng"),
    timezone: text("timezone").notNull().default("UTC"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "user_home_coordinates_valid",
      sql`(${t.homeLat} is null and ${t.homeLng} is null) or (${t.homeLat} is not null and ${t.homeLng} is not null and ${t.homeLat} between -90 and 90 and ${t.homeLng} between -180 and 180)`,
    ),
  ],
);

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
