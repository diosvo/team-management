CREATE TYPE "public"."coach_position" AS ENUM('HEAD_COACH', 'ASSISTANT_COACH', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'CENTER', 'FORWARD', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('COACH', 'PLAYER', 'GUEST', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_state" AS ENUM('ACTIVE', 'INACTIVE', 'TEMPORARILY_ABSENT', 'UNKNOWN');--> statement-breakpoint
CREATE TABLE "coach" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"position" "coach_position" DEFAULT 'UNKNOWN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"jersey_number" integer,
	"position" "player_position" DEFAULT 'UNKNOWN',
	"height" integer,
	"weight" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_jersey_number_unique" UNIQUE("jersey_number"),
	CONSTRAINT "jersey_number" CHECK ("player"."jersey_number" BETWEEN 0 AND 99),
	CONSTRAINT "height" CHECK ("player"."height" BETWEEN 100 AND 200),
	CONSTRAINT "weight" CHECK ("player"."weight" BETWEEN 0 AND 100)
);
--> statement-breakpoint
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
	"is_default" boolean DEFAULT false NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(128),
	"establish_year" integer DEFAULT 2025 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_email_unique" UNIQUE("email"),
	CONSTRAINT "establish_year" CHECK ("team"."establish_year" BETWEEN 2000 AND date_part('year', CURRENT_DATE))
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
	"team_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"dob" date,
	"password" varchar(128),
	"email" varchar(128) NOT NULL,
	"phone_number" varchar(10),
	"citizen_identification" varchar(12),
	"image" text,
	"state" "user_state" DEFAULT 'UNKNOWN' NOT NULL,
	"role" "user_roles" DEFAULT 'PLAYER' NOT NULL,
	"join_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_captain" ON "player" USING btree ("user_id") WHERE "player"."is_captain" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "default_team" ON "team" USING btree ("is_default") WHERE "team"."is_default" = true;