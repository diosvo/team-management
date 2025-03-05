CREATE TABLE "rule" (
	"rule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"team_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"establish_year" integer DEFAULT 2025 NOT NULL,
	CONSTRAINT "establish_year" CHECK ("team"."establish_year" >= 2000 AND "team"."establish_year" <= date_part('year', CURRENT_DATE))
);
--> statement-breakpoint
ALTER TABLE "rule" ADD CONSTRAINT "rule_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_idx" ON "rule" USING btree ("team_id");