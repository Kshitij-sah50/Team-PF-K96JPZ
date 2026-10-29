import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  boolean,
  date,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";
import { locationsTable } from "./watchtower";

// Rise/set times depend on the observing location and belong in a separate table.
// Traditional calendar conversion is deferred until a calendar convention is chosen.
export const moonPhasesTable = pgTable(
  "moon_phases",
  {
    date: date("date").primaryKey(),
    phaseName: text("phase_name").notNull(),
    illuminationPct: doublePrecision("illumination_pct").notNull(),
  },
  (t) => [check("moon_illumination_valid", sql`${t.illuminationPct} between 0 and 100`)],
);

export const moonRiseSetsTable = pgTable(
  "moon_rise_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    moonriseUtc: timestamp("moonrise_utc", { withTimezone: true }),
    moonsetUtc: timestamp("moonset_utc", { withTimezone: true }),
  },
  (t) => [unique("moon_location_date_unique").on(t.locationId, t.date)],
);

export const issPassesTable = pgTable(
  "iss_passes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    riseUtc: timestamp("rise_utc", { withTimezone: true }).notNull(),
    maxElevationDeg: doublePrecision("max_elevation_deg").notNull(),
    durationS: integer("duration_s").notNull(),
    brightnessMag: doublePrecision("brightness_mag"),
  },
  (t) => [
    unique("iss_location_rise_unique").on(t.locationId, t.riseUtc),
    check("iss_ranges_valid", sql`${t.maxElevationDeg} between 0 and 90 and ${t.durationS} > 0`),
  ],
);

export const eventTypesTable = pgTable(
  "event_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code", { enum: ["METEOR", "ECLIPSE", "MOON_PHASE", "ISS_PASS", "LAUNCH"] })
      .notNull()
      .unique(),
    label: text("label").notNull(),
    icon: text("icon").notNull(),
  },
  (t) => [
    check(
      "event_type_code_valid",
      sql`${t.code} in ('METEOR','ECLIPSE','MOON_PHASE','ISS_PASS','LAUNCH')`,
    ),
  ],
);

export const celestialEventsTable = pgTable(
  "celestial_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    typeId: uuid("type_id")
      .notNull()
      .references(() => eventTypesTable.id),
    title: text("title").notNull(),
    description: text("description"),
    startUtc: timestamp("start_utc", { withTimezone: true }).notNull(),
    endUtc: timestamp("end_utc", { withTimezone: true }),
    peakUtc: timestamp("peak_utc", { withTimezone: true }),
    sourceApi: text("source_api").notNull(),
    externalId: text("external_id").notNull(),
    magnitude: doublePrecision("magnitude"),
    visibilityRegion: text("visibility_region"),
    url: text("url"),
  },
  (t) => [
    unique("events_source_external_unique").on(t.sourceApi, t.externalId),
    index("events_start_type_idx").on(t.startUtc, t.typeId),
    check(
      "event_times_valid",
      sql`(${t.endUtc} is null or ${t.endUtc} >= ${t.startUtc}) and (${t.peakUtc} is null or (${t.peakUtc} >= ${t.startUtc} and (${t.endUtc} is null or ${t.peakUtc} <= ${t.endUtc})))`,
    ),
  ],
);

export const eventAlertsTable = pgTable(
  "event_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => celestialEventsTable.id, { onDelete: "cascade" }),
    alertType: text("alert_type", { enum: ["MOONRISE", "EVENT"] }).notNull(),
    alertTime: timestamp("alert_time", { withTimezone: true }).notNull(),
    message: text("message").notNull(),
    isSent: boolean("is_sent").notNull().default(false),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [
    index("alerts_delivery_idx").on(t.isSent, t.alertTime),
    check(
      "alert_kind_valid",
      sql`(${t.alertType} = 'EVENT' and ${t.eventId} is not null) or (${t.alertType} = 'MOONRISE' and ${t.eventId} is null)`,
    ),
    check("alert_sent_valid", sql`${t.isSent} = (${t.sentAt} is not null)`),
  ],
);

export const eventObservationsTable = pgTable(
  "event_observations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => celestialEventsTable.id),
    locationId: uuid("location_id").references(() => locationsTable.id, { onDelete: "set null" }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    photoUrl: text("photo_url"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
  },
  (t) => [
    unique("observation_user_event_unique").on(t.userId, t.eventId),
    check("observation_points_valid", sql`${t.pointsAwarded} >= 0`),
  ],
);
