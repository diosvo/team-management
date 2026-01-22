CREATE TYPE "public"."league_status" AS ENUM('UPCOMING', 'ONGOING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."schedule_type" AS ENUM('FRIENDLY', 'TOURNAMENT');--> statement-breakpoint
CREATE TABLE "league" (
	"league_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "league_status" DEFAULT 'UPCOMING' NOT NULL,
	"description" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"name" varchar(256) NOT NULL,
	"address" varchar NOT NULL,
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
	"schedule_id" uuid NOT NULL,
	"is_league_match" boolean DEFAULT true NOT NULL,
	"is_5x5" boolean DEFAULT true NOT NULL,
	"datetime" timestamp with time zone NOT NULL,
	"home_team" uuid NOT NULL,
	"away_team" uuid NOT NULL,
	"home_team_score" integer DEFAULT 0 NOT NULL,
	"away_team_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diff_team" CHECK ("match"."home_team" != "match"."away_team")
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"schedule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "schedule_type" DEFAULT 'TOURNAMENT' NOT NULL,
	"status" "schedule_status" DEFAULT 'SCHEDULED',
	"league_id" uuid,
	"location_id" uuid,
	"date" date NOT NULL,
	"time" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_type" DROP CONSTRAINT "test_type_name_unique";--> statement-breakpoint
ALTER TABLE "test_result" DROP CONSTRAINT "test_result_player_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "test_result" DROP CONSTRAINT "test_result_type_id_test_type_type_id_fk";
--> statement-breakpoint
ALTER TABLE "test_type" DROP CONSTRAINT "test_type_team_id_team_team_id_fk";
--> statement-breakpoint
DROP TYPE "public"."player_position";--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'CENTER', 'POWER_FORWARD', 'UNKNOWN');--> statement-breakpoint
DROP INDEX "team_captain";--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "establish_year" SET DEFAULT 2026;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "logo_url" varchar(256);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "leave_date" date;--> statement-breakpoint
ALTER TABLE "league_team_roster" ADD CONSTRAINT "league_team_roster_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team_roster" ADD CONSTRAINT "league_team_roster_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team_roster" ADD CONSTRAINT "league_team_roster_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team" ADD CONSTRAINT "league_team_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team" ADD CONSTRAINT "league_team_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_match_id_match_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_schedule_id_schedule_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("schedule_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_home_team_team_team_id_fk" FOREIGN KEY ("home_team") REFERENCES "public"."team"("team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_away_team_team_team_id_fk" FOREIGN KEY ("away_team") REFERENCES "public"."team"("team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_location_id_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_type_id_test_type_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."test_type"("type_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_type" ADD CONSTRAINT "test_type_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_unique" UNIQUE("team_id");