import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  integer,
  timestamp,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const locationsTable = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type", { enum: ["shrine", "mountain", "temple", "park", "observatory"] }).notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    elevationM: doublePrecision("elevation_m"),
    bortleClass: integer("bortle_class"),
    description: text("description"),
  },
  (t) => [
    index("locations_coordinates_idx").on(t.lat, t.lng),
    check(
      "locations_coordinates_valid",
      sql`${t.lat} between -90 and 90 and ${t.lng} between -180 and 180`,
    ),
    check("locations_bortle_valid", sql`${t.bortleClass} between 1 and 9`),
    check(
      "locations_type_valid",
      sql`${t.type} in ('shrine','mountain','temple','park','observatory')`,
    ),
  ],
);

export const weatherSnapshotsTable = pgTable(
  "weather_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    forecastFor: timestamp("forecast_for", { withTimezone: true }).notNull(),
    cloudCoverPct: doublePrecision("cloud_cover_pct").notNull(),
    humidityPct: doublePrecision("humidity_pct").notNull(),
    visibilityKm: doublePrecision("visibility_km").notNull(),
    temperatureC: doublePrecision("temperature_c"),
    windKph: doublePrecision("wind_kph"),
  },
  (t) => [
    index("weather_location_forecast_idx").on(t.locationId, t.forecastFor),
    check(
      "weather_ranges_valid",
      sql`${t.cloudCoverPct} between 0 and 100 and ${t.humidityPct} between 0 and 100 and ${t.visibilityKm} >= 0 and (${t.windKph} is null or ${t.windKph} >= 0)`,
    ),
  ],
);

export const nightScoresTable = pgTable(
  "night_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => weatherSnapshotsTable.id, { onDelete: "cascade" })
      .unique(),
    // The location is obtained through the snapshot, avoiding inconsistent location/snapshot pairs.
    score: doublePrecision("score").notNull(),
    cloudComponent: doublePrecision("cloud_component").notNull(),
    visibilityComponent: doublePrecision("visibility_component").notNull(),
    humidityComponent: doublePrecision("humidity_component").notNull(),
    lightPollutionComponent: doublePrecision("light_pollution_component").notNull(),
    moonIlluminationComponent: doublePrecision("moon_illumination_component").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("night_score_range_valid", sql`${t.score} between 0 and 100`),
    check(
      "night_components_valid",
      sql`${t.cloudComponent} between 0 and 40 and ${t.visibilityComponent} between 0 and 20 and ${t.humidityComponent} between 0 and 15 and ${t.lightPollutionComponent} between 0 and 15 and ${t.moonIlluminationComponent} between 0 and 10`,
    ),
  ],
);

export const savedLocationsTable = pgTable(
  "saved_locations",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.locationId] })],
);
