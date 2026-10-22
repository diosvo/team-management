-- A match had no lifecycle: every row carried a score defaulting to 0, so a
-- fixture that has not been played yet was indistinguishable from a real 0-0
-- draw, and both fed the win rate. `status` mirrors `training_session.status`
-- (minus `active`, which a match has no use for) and only a `completed` match
-- is allowed to carry a score.
--
-- Two other things follow from that:
--
--   * Backfill reads the existing rows the way the app wrote them: everything
--     already played (dated today or earlier) or already scored is `completed`.
--     Only future, still-scoreless rows stay `scheduled`, so no existing row
--     trips the new check constraint and no score is thrown away.
--
--   * `match.home_team` / `away_team` had no ON DELETE behaviour, which is
--     `NO ACTION` — the same runtime block as RESTRICT, but surfacing as a raw
--     FK error. Made explicit as RESTRICT, with `removeTeam` now checking for
--     match history first and explaining the block in plain words.

CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint

ALTER TABLE "match" ADD COLUMN "status" "match_status" DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint

UPDATE "match"
SET "status" = 'completed'
WHERE "date" <= CURRENT_DATE
   OR "home_team_score" <> 0
   OR "away_team_score" <> 0;--> statement-breakpoint

ALTER TABLE "match" ADD CONSTRAINT "unplayed_match_has_no_score"
  CHECK ("match"."status" = 'completed' OR ("match"."home_team_score" = 0 AND "match"."away_team_score" = 0));--> statement-breakpoint

ALTER TABLE "match" DROP CONSTRAINT "match_home_team_team_team_id_fk";--> statement-breakpoint
ALTER TABLE "match" DROP CONSTRAINT "match_away_team_team_team_id_fk";--> statement-breakpoint

ALTER TABLE "match" ADD CONSTRAINT "match_home_team_team_team_id_fk"
  FOREIGN KEY ("home_team") REFERENCES "public"."team"("team_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_away_team_team_team_id_fk"
  FOREIGN KEY ("away_team") REFERENCES "public"."team"("team_id") ON DELETE restrict ON UPDATE no action;
