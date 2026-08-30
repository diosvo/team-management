CREATE TABLE "user_team" (
	"user_team_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"team_id" uuid NOT NULL,
	"join_date" date NOT NULL,
	"leave_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_team_stint" UNIQUE("user_id","team_id","join_date"),
	CONSTRAINT "membership_dates" CHECK ("user_team"."leave_date" IS NULL OR "user_team"."leave_date" >= "user_team"."join_date")
);
--> statement-breakpoint
ALTER TABLE "user_team" ADD CONSTRAINT "user_team_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_team" ADD CONSTRAINT "user_team_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_current_team" ON "user_team" USING btree ("user_id") WHERE "user_team"."leave_date" IS NULL;--> statement-breakpoint

-- Backfill: every existing user becomes one stint on their current team.
-- `join_date` is nullable today, so fall back to when the account was created.
-- A `leave_date` that predates the join date would violate `membership_dates`;
-- clamp it to the join date rather than dropping the fact that they left.
INSERT INTO "user_team" ("user_id", "team_id", "join_date", "leave_date")
SELECT
	u."id",
	u."team_id",
	COALESCE(u."join_date", u."created_at"::date),
	CASE
		WHEN u."leave_date" IS NULL THEN NULL
		ELSE GREATEST(u."leave_date", COALESCE(u."join_date", u."created_at"::date))
	END
FROM "user" u;--> statement-breakpoint

ALTER TABLE "user" DROP COLUMN "join_date";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "leave_date";--> statement-breakpoint

-- Match stats gain team context. Added nullable, backfilled from the player's
-- team at the time of the migration, then locked to NOT NULL.
ALTER TABLE "match_player_stats" ADD COLUMN "team_id" uuid;--> statement-breakpoint
UPDATE "match_player_stats" mps
SET "team_id" = u."team_id"
FROM "user" u
WHERE u."id" = mps."player_id";--> statement-breakpoint
ALTER TABLE "match_player_stats" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;
