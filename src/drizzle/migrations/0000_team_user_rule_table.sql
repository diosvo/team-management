CREATE TYPE "public"."user_roles" AS ENUM('SUPER_ADMIN', 'COACH', 'PLAYER', 'CAPTAIN', 'GUEST');--> statement-breakpoint
CREATE TYPE "public"."user_state" AS ENUM('UNKNOWN', 'ACTIVE', 'INACTIVE', 'TEMPORARILY_ABSENT');--> statement-breakpoint
CREATE TABLE "rule" (
	"rule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"team_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"establish_year" integer DEFAULT 2025 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_email_unique" UNIQUE("email"),
	CONSTRAINT "establish_year" CHECK ("team"."establish_year" >= 2000 AND "team"."establish_year" <= date_part('year', CURRENT_DATE))
);
--> statement-breakpoint
CREATE TABLE "password_token" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "password_token_id_unique" UNIQUE("id"),
	CONSTRAINT "password_token_email_unique" UNIQUE("email"),
	CONSTRAINT "password_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"dob" date,
	"password" varchar(128),
	"email" text NOT NULL,
	"phone_number" varchar(15),
	"citizen_identification" varchar(12),
	"image" text,
	"state" "user_state" DEFAULT 'ACTIVE' NOT NULL,
	"roles" "user_roles"[] DEFAULT '{"PLAYER"}' NOT NULL,
	"join_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "roles_length" CHECK (array_length("user"."roles", 1) BETWEEN 1 AND 2)
);
--> statement-breakpoint
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;