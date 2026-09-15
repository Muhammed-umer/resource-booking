CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN_SEMINAR', 'ADMIN_RESOURCE');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "role" NOT NULL,
	"department" "department",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
