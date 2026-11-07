-- `achievement` had no owner, so `getAchievements` returned every team's rows.
-- Existing honors all belong to the club, i.e. the default team, so the new
-- column is backfilled from it before it becomes NOT NULL. The one-per-league
-- unique index now includes the team so two teams can hold the same honor.

DROP INDEX "achievement_league_type_idx";--> statement-breakpoint
ALTER TABLE "achievement" ADD COLUMN "team_id" uuid;--> statement-breakpoint
UPDATE "achievement"
SET "team_id" = (SELECT "team_id" FROM "team" WHERE "is_default" LIMIT 1);--> statement-breakpoint
ALTER TABLE "achievement" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "achievement" ADD CONSTRAINT "achievement_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "achievement_team_league_type_idx" ON "achievement" USING btree ("team_id","league_id","type") WHERE "achievement"."league_id" IS NOT NULL AND "achievement"."type" != 'custom';
