ALTER TABLE "schedule" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "schedule" CASCADE;--> statement-breakpoint
ALTER TABLE "location" ALTER COLUMN "name" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "location" ALTER COLUMN "address" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "is_5x5" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "league_id" uuid;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_league_id_league_league_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."league"("league_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_location_id_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "schedule_id";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "is_league_match";--> statement-breakpoint
DROP TYPE "public"."schedule_status";--> statement-breakpoint
DROP TYPE "public"."schedule_type";