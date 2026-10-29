CREATE TABLE "event_feed_items" (
	"feed_key" text NOT NULL,
	"event_id" uuid NOT NULL,
	CONSTRAINT "event_feed_items_feed_key_event_id_pk" PRIMARY KEY("feed_key","event_id")
);
--> statement-breakpoint
CREATE TABLE "event_feed_sync" (
	"key" text PRIMARY KEY NOT NULL,
	"attempted_at" timestamp with time zone NOT NULL,
	"succeeded_at" timestamp with time zone,
	"failed" boolean DEFAULT false NOT NULL,
	"truncated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_feed_items" ADD CONSTRAINT "event_feed_items_feed_key_event_feed_sync_key_fk" FOREIGN KEY ("feed_key") REFERENCES "public"."event_feed_sync"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_feed_items" ADD CONSTRAINT "event_feed_items_event_id_celestial_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."celestial_events"("id") ON DELETE cascade ON UPDATE no action;