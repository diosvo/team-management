-- Nothing ever wrote `league_team` outside the seed, so existing rosters can
-- reference pairs that were never entered into the league. Adopt those pairs
-- rather than dropping the roster rows that depend on them.
INSERT INTO "league_team" ("league_id", "team_id")
SELECT DISTINCT "league_id", "team_id" FROM "league_team_roster"
ON CONFLICT ("league_id", "team_id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "league_team_roster" ADD CONSTRAINT "league_team_roster_league_team_fk" FOREIGN KEY ("league_id","team_id") REFERENCES "public"."league_team"("league_id","team_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "league" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."league_status";