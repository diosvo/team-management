ALTER TABLE "team" ADD COLUMN "is_external" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- Backfill from what the flag replaces: `is_default = false` was the opponent
-- marker, so mirroring it keeps the /teams listing showing exactly what it
-- showed before. The ticket describes opponents as also having no users; that
-- holds for every non-default team in practice, and deriving from it instead
-- would make any team that does have members invisible in every UI.
UPDATE "team" SET "is_external" = NOT "is_default";--> statement-breakpoint

ALTER TABLE "team" ADD CONSTRAINT "default_team_not_external" CHECK (NOT ("team"."is_default" AND "team"."is_external"));
