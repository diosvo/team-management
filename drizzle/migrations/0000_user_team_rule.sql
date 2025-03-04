CREATE TYPE "public"."user_roles" AS ENUM('SUPER_ADMIN', 'COACH', 'PLAYER', 'CAPTAIN');--> statement-breakpoint
CREATE TYPE "public"."user_state" AS ENUM('UNKNOWN', 'ACTIVE', 'INACTIVE', 'TEMPORARILY_ABSENT');--> statement-breakpoint
CREATE TABLE "rule" (
	"rule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"team_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"establish_year" integer DEFAULT 2025 NOT NULL,
	CONSTRAINT "establish_year" CHECK ("team"."establish_year" >= 2000 AND "team"."establish_year" <= date_part('year', CURRENT_DATE))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(128) NOT NULL,
	"dob" date NOT NULL,
	"username" varchar NOT NULL,
	"password" varchar(128) NOT NULL,
	"email" varchar,
	"phone_number" varchar(15),
	"roles" "user_roles"[],
	"avatar" text,
	"join_date" timestamp with time zone DEFAULT now() NOT NULL,
	"state" "user_state" DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");