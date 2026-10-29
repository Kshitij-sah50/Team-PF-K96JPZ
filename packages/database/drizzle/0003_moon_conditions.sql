ALTER TABLE "moon_rise_sets" ADD COLUMN "phase_name" text;--> statement-breakpoint
ALTER TABLE "moon_rise_sets" ADD COLUMN "illumination_pct" double precision;--> statement-breakpoint
ALTER TABLE "moon_rise_sets" ADD COLUMN "fetched_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "moon_rise_sets" ADD CONSTRAINT "moon_rise_illumination_valid" CHECK ("moon_rise_sets"."illumination_pct" between 0 and 100);