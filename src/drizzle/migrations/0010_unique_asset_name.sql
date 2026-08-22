ALTER TABLE "asset" DROP CONSTRAINT "asset_name_unique";--> statement-breakpoint
ALTER TABLE "player" DROP CONSTRAINT "player_jersey_number_unique";--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_team_id_team_team_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_session_id_training_session_session_id_fk";
--> statement-breakpoint
ALTER TABLE "achievement" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."achievement_type";--> statement-breakpoint
CREATE TYPE "public"."achievement_type" AS ENUM('champion', 'runner_up', 'third_place', 'mvp', 'top_scorer', 'custom');--> statement-breakpoint
ALTER TABLE "achievement" ALTER COLUMN "type" SET DATA TYPE "public"."achievement_type" USING "type"::"public"."achievement_type";--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "category" SET DEFAULT 'equipment'::text;--> statement-breakpoint
DROP TYPE "public"."asset_catogory";--> statement-breakpoint
CREATE TYPE "public"."asset_catogory" AS ENUM('equipment', 'training', 'others');--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "category" SET DEFAULT 'equipment'::"public"."asset_catogory";--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "category" SET DATA TYPE "public"."asset_catogory" USING "category"::"public"."asset_catogory";--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "condition" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "condition" SET DEFAULT 'good'::text;--> statement-breakpoint
DROP TYPE "public"."asset_condition";--> statement-breakpoint
CREATE TYPE "public"."asset_condition" AS ENUM('poor', 'fair', 'good', 'obsolete');--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "condition" SET DEFAULT 'good'::"public"."asset_condition";--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "condition" SET DATA TYPE "public"."asset_condition" USING "condition"::"public"."asset_condition";--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DEFAULT 'on_time'::text;--> statement-breakpoint
DROP TYPE "public"."attendance_status";--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('on_time', 'absent', 'late');--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DEFAULT 'on_time'::"public"."attendance_status";--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DATA TYPE "public"."attendance_status" USING "status"::"public"."attendance_status";--> statement-breakpoint
ALTER TABLE "coach" ALTER COLUMN "position" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "coach" ALTER COLUMN "position" SET DEFAULT 'unknown'::text;--> statement-breakpoint
DROP TYPE "public"."coach_position";--> statement-breakpoint
CREATE TYPE "public"."coach_position" AS ENUM('head_coach', 'assistant_coach', 'unknown');--> statement-breakpoint
ALTER TABLE "coach" ALTER COLUMN "position" SET DEFAULT 'unknown'::"public"."coach_position";--> statement-breakpoint
ALTER TABLE "coach" ALTER COLUMN "position" SET DATA TYPE "public"."coach_position" USING "position"::"public"."coach_position";--> statement-breakpoint
ALTER TABLE "league" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "league" ALTER COLUMN "status" SET DEFAULT 'upcoming'::text;--> statement-breakpoint
DROP TYPE "public"."league_status";--> statement-breakpoint
CREATE TYPE "public"."league_status" AS ENUM('upcoming', 'ongoing', 'ended');--> statement-breakpoint
ALTER TABLE "league" ALTER COLUMN "status" SET DEFAULT 'upcoming'::"public"."league_status";--> statement-breakpoint
ALTER TABLE "league" ALTER COLUMN "status" SET DATA TYPE "public"."league_status" USING "status"::"public"."league_status";--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "position" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "position" SET DEFAULT 'unknown'::text;--> statement-breakpoint
DROP TYPE "public"."player_position";--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('point_guard', 'shooting_guard', 'small_forward', 'power_forward', 'center', 'unknown');--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "position" SET DEFAULT 'unknown'::"public"."player_position";--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "position" SET DATA TYPE "public"."player_position" USING "position"::"public"."player_position";--> statement-breakpoint
ALTER TABLE "training_session" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "training_session" ALTER COLUMN "status" SET DEFAULT 'scheduled'::text;--> statement-breakpoint
DROP TYPE "public"."session_status";--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'active', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "training_session" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"public"."session_status";--> statement-breakpoint
ALTER TABLE "training_session" ALTER COLUMN "status" SET DATA TYPE "public"."session_status" USING "status"::"public"."session_status";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'player'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('coach', 'player', 'guest', 'super_admin');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'player'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "state" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "state" SET DEFAULT 'unknown'::text;--> statement-breakpoint
DROP TYPE "public"."user_state";--> statement-breakpoint
CREATE TYPE "public"."user_state" AS ENUM('active', 'inactive', 'temporarily_absent', 'unknown');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "state" SET DEFAULT 'unknown'::"public"."user_state";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "state" SET DATA TYPE "public"."user_state" USING "state"::"public"."user_state";--> statement-breakpoint
DROP INDEX "achievement_league_type_idx";--> statement-breakpoint
DROP INDEX "unique_player_per_date";--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_date_fk" FOREIGN KEY ("session_id","date") REFERENCES "public"."training_session"("session_id","date") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "team_asset_name" ON "asset" USING btree ("team_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_per_session" ON "attendance" USING btree ("player_id","session_id") WHERE "attendance"."session_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "achievement_league_type_idx" ON "achievement" USING btree ("league_id","type") WHERE "achievement"."league_id" IS NOT NULL AND "achievement"."type" != 'custom';--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_per_date" ON "attendance" USING btree ("player_id","date") WHERE "attendance"."session_id" IS NULL;--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_id_date_unique" UNIQUE("session_id","date");