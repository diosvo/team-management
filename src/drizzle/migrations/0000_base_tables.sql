CREATE TYPE "public"."asset_catogory" AS ENUM('EQUIPMENT', 'TRAINING', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."asset_condition" AS ENUM('POOR', 'FAIR', 'GOOD');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('ON_TIME', 'ABSENT', 'LATE');--> statement-breakpoint
CREATE TYPE "public"."coach_position" AS ENUM('HEAD_COACH', 'ASSISTANT_COACH', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."league_status" AS ENUM('UPCOMING', 'ONGOING', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."test_type_unit" AS ENUM('meters', 'percent', 'points', 'reps', 'seconds', 'times');--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('COACH', 'PLAYER', 'GUEST', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_state" AS ENUM('ACTIVE', 'INACTIVE', 'TEMPORARILY_ABSENT', 'UNKNOWN');--> statement-breakpoint
CREATE TABLE "asset" (
	"asset_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"category" "asset_catogory" DEFAULT 'EQUIPMENT' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition" "asset_condition" DEFAULT 'GOOD' NOT NULL,
	"note" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"attendance_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" text NOT NULL,
	"session_id" uuid,
	"status" "attendance_status" DEFAULT 'ON_TIME' NOT NULL,
	"date" date NOT NULL,
	"reason" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach" (
	"id" text PRIMARY KEY NOT NULL,
	"position" "coach_position" DEFAULT 'UNKNOWN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league" (
	"league_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "league_status" DEFAULT 'UPCOMING' NOT NULL,
	"description" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "league_team_roster" (
	"league_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_team_roster_league_id_team_id_player_id_pk" PRIMARY KEY("league_id","team_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "league_team" (
	"league_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_team_league_id_team_id_pk" PRIMARY KEY("league_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "location" (
	"location_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"address" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_player_stats" (
	"match_id" uuid NOT NULL,
	"player_id" text NOT NULL,
	"points_scored" integer DEFAULT 0 NOT NULL,
	"rebounds" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"steals" integer DEFAULT 0,
	"blocks" integer DEFAULT 0,
	"turnovers" integer DEFAULT 0,
	"fouls" integer DEFAULT 0,
	"minutes_played" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_player_stats_match_id_player_id_pk" PRIMARY KEY("match_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "match" (
	"match_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_5x5" boolean NOT NULL,
	"league_id" uuid,
	"location_id" uuid,
	"home_team" uuid NOT NULL,
	"away_team" uuid NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"home_team_score" integer DEFAULT 0 NOT NULL,
	"away_team_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diff_team" CHECK ("match"."home_team" != "match"."away_team")
);
--> statement-breakpoint
CREATE TABLE "test_result" (
	"result_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" text NOT NULL,
	"type_id" uuid NOT NULL,
	"result" numeric(10, 3) NOT NULL,
	"date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_type" (
	"type_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"unit" "test_type_unit" DEFAULT 'times' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" text PRIMARY KEY NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"jersey_number" integer,
	"position" "player_position" DEFAULT 'UNKNOWN',
	"height" integer,
	"weight" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_jersey_number_unique" UNIQUE("jersey_number"),
	CONSTRAINT "jersey_number" CHECK ("player"."jersey_number" BETWEEN 0 AND 99),
	CONSTRAINT "height" CHECK ("player"."height" BETWEEN 0 AND 200),
	CONSTRAINT "weight" CHECK ("player"."weight" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "rule" (
	"rule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rule_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"team_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(128),
	"establish_year" integer DEFAULT 2026 NOT NULL,
	"logo_url" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_email_unique" UNIQUE("email"),
	CONSTRAINT "establish_year" CHECK ("team"."establish_year" BETWEEN 2000 AND date_part('year', CURRENT_DATE))
);
--> statement-breakpoint
CREATE TABLE "training_session" (
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"coach_id" text,
	"location_id" uuid,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" "session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"dob" date,
	"phone_number" varchar(10),
	"citizen_identification" varchar(12),
	"state" "user_state" DEFAULT 'UNKNOWN' NOT NULL,
	"role" "user_role" DEFAULT 'PLAYER' NOT NULL,
	"join_date" date,
	"leave_date" date,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_training_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("session_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team_roster" ADD CONSTRAINT "league_team_roster_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team_roster" ADD CONSTRAINT "league_team_roster_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team_roster" ADD CONSTRAINT "league_team_roster_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team" ADD CONSTRAINT "league_team_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team" ADD CONSTRAINT "league_team_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_match_id_match_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_location_id_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_home_team_team_team_id_fk" FOREIGN KEY ("home_team") REFERENCES "public"."team"("team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_away_team_team_team_id_fk" FOREIGN KEY ("away_team") REFERENCES "public"."team"("team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_type_id_test_type_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."test_type"("type_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_type" ADD CONSTRAINT "test_type_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_location_id_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_per_date" ON "attendance" USING btree ("player_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "team_test_type_name" ON "test_type" USING btree ("team_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "default_team" ON "team" USING btree ("is_default") WHERE "team"."is_default" = true;