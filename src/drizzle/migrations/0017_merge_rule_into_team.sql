ALTER TABLE "team" ADD COLUMN "rule_content" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "rule_updated_at" timestamp with time zone;--> statement-breakpoint

-- Move the document onto its team. `rule.team_id` is unique, so this is a
-- straight 1:1 copy; `rule.updated_at` becomes `rule_updated_at` so the
-- editor's "last updated" survives the merge.
UPDATE "team" t
SET "rule_content" = r."content",
	"rule_updated_at" = r."updated_at"
FROM "rule" r
WHERE r."team_id" = t."team_id";--> statement-breakpoint

DROP TABLE "rule" CASCADE;
