CREATE TABLE "booking_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_booking_id_bookings_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("booking_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_slots_booking_date_idx" ON "booking_slots" USING btree ("booking_id","date");--> statement-breakpoint
CREATE INDEX "booking_slots_date_idx" ON "booking_slots" USING btree ("date");--> statement-breakpoint
-- Backfill: every existing booking occupied the same hours on each day of its range.
INSERT INTO "booking_slots" ("booking_id", "date", "start_time", "end_time")
SELECT b."booking_id", d::date, b."start_time", b."end_time"
FROM "bookings" b
CROSS JOIN LATERAL generate_series(b."from_date"::timestamp, b."to_date"::timestamp, interval '1 day') AS d
ON CONFLICT DO NOTHING;
