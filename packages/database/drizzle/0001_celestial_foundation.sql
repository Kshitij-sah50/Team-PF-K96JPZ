CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"elevation_m" double precision,
	"bortle_class" integer,
	"description" text,
	CONSTRAINT "locations_coordinates_valid" CHECK ("locations"."lat" between -90 and 90 and "locations"."lng" between -180 and 180),
	CONSTRAINT "locations_bortle_valid" CHECK ("locations"."bortle_class" between 1 and 9),
	CONSTRAINT "locations_type_valid" CHECK ("locations"."type" in ('shrine','mountain','temple','park','observatory'))
);
--> statement-breakpoint
CREATE TABLE "night_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"score" double precision NOT NULL,
	"cloud_component" double precision NOT NULL,
	"visibility_component" double precision NOT NULL,
	"humidity_component" double precision NOT NULL,
	"light_pollution_component" double precision NOT NULL,
	"moon_illumination_component" double precision NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "night_scores_snapshot_id_unique" UNIQUE("snapshot_id"),
	CONSTRAINT "night_score_range_valid" CHECK ("night_scores"."score" between 0 and 100),
	CONSTRAINT "night_components_valid" CHECK ("night_scores"."cloud_component" between 0 and 40 and "night_scores"."visibility_component" between 0 and 20 and "night_scores"."humidity_component" between 0 and 15 and "night_scores"."light_pollution_component" between 0 and 15 and "night_scores"."moon_illumination_component" between 0 and 10)
);
--> statement-breakpoint
CREATE TABLE "saved_locations" (
	"user_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_locations_user_id_location_id_pk" PRIMARY KEY("user_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "weather_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"forecast_for" timestamp with time zone NOT NULL,
	"cloud_cover_pct" double precision NOT NULL,
	"humidity_pct" double precision NOT NULL,
	"visibility_km" double precision NOT NULL,
	"temperature_c" double precision,
	"wind_kph" double precision,
	CONSTRAINT "weather_ranges_valid" CHECK ("weather_snapshots"."cloud_cover_pct" between 0 and 100 and "weather_snapshots"."humidity_pct" between 0 and 100 and "weather_snapshots"."visibility_km" >= 0 and ("weather_snapshots"."wind_kph" is null or "weather_snapshots"."wind_kph" >= 0))
);
--> statement-breakpoint
CREATE TABLE "celestial_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_utc" timestamp with time zone NOT NULL,
	"end_utc" timestamp with time zone,
	"peak_utc" timestamp with time zone,
	"source_api" text NOT NULL,
	"external_id" text NOT NULL,
	"magnitude" double precision,
	"visibility_region" text,
	"url" text,
	CONSTRAINT "events_source_external_unique" UNIQUE("source_api","external_id"),
	CONSTRAINT "event_times_valid" CHECK (("celestial_events"."end_utc" is null or "celestial_events"."end_utc" >= "celestial_events"."start_utc") and ("celestial_events"."peak_utc" is null or ("celestial_events"."peak_utc" >= "celestial_events"."start_utc" and ("celestial_events"."end_utc" is null or "celestial_events"."peak_utc" <= "celestial_events"."end_utc"))))
);
--> statement-breakpoint
CREATE TABLE "event_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid,
	"alert_type" text NOT NULL,
	"alert_time" timestamp with time zone NOT NULL,
	"message" text NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "alert_kind_valid" CHECK (("event_alerts"."alert_type" = 'EVENT' and "event_alerts"."event_id" is not null) or ("event_alerts"."alert_type" = 'MOONRISE' and "event_alerts"."event_id" is null)),
	CONSTRAINT "alert_sent_valid" CHECK ("event_alerts"."is_sent" = ("event_alerts"."sent_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "event_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"location_id" uuid,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"photo_url" text,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "observation_user_event_unique" UNIQUE("user_id","event_id"),
	CONSTRAINT "observation_points_valid" CHECK ("event_observations"."points_awarded" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	CONSTRAINT "event_types_code_unique" UNIQUE("code"),
	CONSTRAINT "event_type_code_valid" CHECK ("event_types"."code" in ('METEOR','ECLIPSE','MOON_PHASE','ISS_PASS','LAUNCH'))
);
--> statement-breakpoint
CREATE TABLE "iss_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"rise_utc" timestamp with time zone NOT NULL,
	"max_elevation_deg" double precision NOT NULL,
	"duration_s" integer NOT NULL,
	"brightness_mag" double precision,
	CONSTRAINT "iss_location_rise_unique" UNIQUE("location_id","rise_utc"),
	CONSTRAINT "iss_ranges_valid" CHECK ("iss_passes"."max_elevation_deg" between 0 and 90 and "iss_passes"."duration_s" > 0)
);
--> statement-breakpoint
CREATE TABLE "moon_phases" (
	"date" date PRIMARY KEY NOT NULL,
	"phase_name" text NOT NULL,
	"illumination_pct" double precision NOT NULL,
	CONSTRAINT "moon_illumination_valid" CHECK ("moon_phases"."illumination_pct" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "moon_rise_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"date" date NOT NULL,
	"moonrise_utc" timestamp with time zone,
	"moonset_utc" timestamp with time zone,
	CONSTRAINT "moon_location_date_unique" UNIQUE("location_id","date")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"points_required" integer NOT NULL,
	CONSTRAINT "badges_name_unique" UNIQUE("name"),
	CONSTRAINT "badge_points_valid" CHECK ("badges"."points_required" >= 0)
);
--> statement-breakpoint
CREATE TABLE "honor_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'night' NOT NULL,
	"alert_lead_minutes" integer DEFAULT 30 NOT NULL,
	"notify_email" boolean DEFAULT false NOT NULL,
	"default_radius_km" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "preferences_valid" CHECK ("user_preferences"."theme" in ('day','night') and "user_preferences"."alert_lead_minutes" >= 0 and "user_preferences"."default_radius_km" > 0)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "home_lat" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "home_lng" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "night_scores" ADD CONSTRAINT "night_scores_snapshot_id_weather_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."weather_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_locations" ADD CONSTRAINT "saved_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_locations" ADD CONSTRAINT "saved_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "celestial_events" ADD CONSTRAINT "celestial_events_type_id_event_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."event_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_alerts" ADD CONSTRAINT "event_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_alerts" ADD CONSTRAINT "event_alerts_event_id_celestial_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."celestial_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_observations" ADD CONSTRAINT "event_observations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_observations" ADD CONSTRAINT "event_observations_event_id_celestial_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."celestial_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_observations" ADD CONSTRAINT "event_observations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iss_passes" ADD CONSTRAINT "iss_passes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moon_rise_sets" ADD CONSTRAINT "moon_rise_sets_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honor_ledger" ADD CONSTRAINT "honor_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honor_ledger" ADD CONSTRAINT "honor_ledger_event_id_celestial_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."celestial_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "locations_coordinates_idx" ON "locations" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "weather_location_forecast_idx" ON "weather_snapshots" USING btree ("location_id","forecast_for");--> statement-breakpoint
CREATE INDEX "events_start_type_idx" ON "celestial_events" USING btree ("start_utc","type_id");--> statement-breakpoint
CREATE INDEX "alerts_delivery_idx" ON "event_alerts" USING btree ("is_sent","alert_time");--> statement-breakpoint
CREATE INDEX "honor_user_created_idx" ON "honor_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "user_home_coordinates_valid" CHECK (("users"."home_lat" is null and "users"."home_lng" is null) or ("users"."home_lat" is not null and "users"."home_lng" is not null and "users"."home_lat" between -90 and 90 and "users"."home_lng" between -180 and 180));