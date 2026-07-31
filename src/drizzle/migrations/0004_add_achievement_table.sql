CREATE TYPE "public"."achievement_type" AS ENUM('CHAMPION', 'RUNNER_UP', 'THIRD_PLACE', 'MVP', 'TOP_SCORER', 'CUSTOM');--> statement-breakpoint
CREATE TABLE "achievement" (
	"achievement_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "achievement_type" NOT NULL,
	"title" varchar(128) NOT NULL,
	"year" integer NOT NULL,
	"league_id" uuid,
	"player_id" text,
	"description" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievement" ADD CONSTRAINT "achievement_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement" ADD CONSTRAINT "achievement_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "achievement_league_type_idx" ON "achievement" USING btree ("league_id","type") WHERE "achievement"."league_id" IS NOT NULL AND "achievement"."type" != 'CUSTOM';