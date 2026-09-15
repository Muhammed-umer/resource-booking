CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('CSE', 'MECHANICAL', 'EEE', 'ECE', 'IT', 'AUTOMOBILE', 'CIVIL');--> statement-breakpoint
CREATE TYPE "public"."facility_type" AS ENUM('SEMINAR_HALL', 'AUDITORIUM', 'GUEST_HOUSE');--> statement-breakpoint
CREATE TABLE "bookings" (
	"booking_id" serial PRIMARY KEY NOT NULL,
	"facility_type" "facility_type" NOT NULL,
	"event_name" text NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"department" "department" NOT NULL,
	"booking_status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" text NOT NULL,
	"requested_by_name" text NOT NULL,
	"admin_message" varchar(500),
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_house_bookings" (
	"booking_id" serial PRIMARY KEY NOT NULL,
	"guest_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"purpose" text,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"check_in_time" time,
	"check_out_time" time,
	"room_number" integer NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" text NOT NULL,
	"requested_by_name" text NOT NULL,
	"fees" numeric(10, 2),
	"admin_message" varchar(500),
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bookings_conflict_idx" ON "bookings" USING btree ("facility_type","booking_status","from_date","to_date");--> statement-breakpoint
CREATE INDEX "bookings_requested_by_idx" ON "bookings" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "guest_house_conflict_idx" ON "guest_house_bookings" USING btree ("room_number","status","from_date","to_date");--> statement-breakpoint
CREATE INDEX "guest_house_requested_by_idx" ON "guest_house_bookings" USING btree ("requested_by");