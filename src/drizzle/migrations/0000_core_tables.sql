CREATE TYPE "public"."asset_catogory" AS ENUM('EQUIPMENT', 'TRAINING', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."asset_condition" AS ENUM('POOR', 'FAIR', 'GOOD');--> statement-breakpoint
CREATE TYPE "public"."coach_position" AS ENUM('HEAD_COACH', 'ASSISTANT_COACH', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."test_type_unit" AS ENUM('meters', 'percent', 'points', 'reps', 'seconds', 'times');--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'CENTER', 'FORWARD', 'UNKNOWN');--> statement-breakpoint
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "coach" (
	"id" text PRIMARY KEY NOT NULL,
	"position" "coach_position" DEFAULT 'UNKNOWN' NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_result" (
	"result_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" text NOT NULL,
	"type_id" uuid NOT NULL,
	"result" numeric(10, 3) NOT NULL,
	"date" date,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_type" (
	"type_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"unit" "test_type_unit" DEFAULT 'times' NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_type_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" text PRIMARY KEY NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"jersey_number" integer,
	"position" "player_position" DEFAULT 'UNKNOWN',
	"height" integer,
	"weight" integer,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"team_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(128),
	"establish_year" integer DEFAULT 2025 NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_email_unique" UNIQUE("email"),
	CONSTRAINT "establish_year" CHECK ("team"."establish_year" BETWEEN 2000 AND date_part('year', CURRENT_DATE))
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"dob" date,
	"phone_number" varchar(10),
	"citizen_identification" varchar(12),
	"state" "user_state" DEFAULT 'UNKNOWN' NOT NULL,
	"role" "user_role" DEFAULT 'PLAYER' NOT NULL,
	"join_date" date,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"create_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_player_id_user_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_type_id_test_type_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."test_type"("type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_type" ADD CONSTRAINT "test_type_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_test_type_name" ON "test_type" USING btree ("team_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "team_captain" ON "player" USING btree ("id") WHERE "player"."is_captain" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "default_team" ON "team" USING btree ("is_default") WHERE "team"."is_default" = true;