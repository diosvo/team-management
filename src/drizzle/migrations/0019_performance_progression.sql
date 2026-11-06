-- Performance progression turns periodic test results into a development
-- timeline, which needs two things a test type did not carry:
--
--   * `higher_is_better`: the direction of improvement. Timed tests get better
--     as the number drops, so every existing `seconds` type is backfilled to
--     `false`; everything else (reps, points, meters, ...) keeps the default.
--
--   * `target`: an optional team benchmark the progression bands compare to.
--
-- `test_note` holds a coach's observations and the goal for the next test.

CREATE TABLE "test_note" (
	"note_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" text NOT NULL,
	"type_id" uuid,
	"content" text NOT NULL,
	"goal" numeric(10, 3),
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_type" ADD COLUMN "higher_is_better" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "test_type" ADD COLUMN "target" numeric(10, 3);--> statement-breakpoint
UPDATE "test_type" SET "higher_is_better" = false WHERE "unit" = 'seconds';--> statement-breakpoint
ALTER TABLE "test_note" ADD CONSTRAINT "test_note_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_note" ADD CONSTRAINT "test_note_type_id_test_type_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."test_type"("type_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_note" ADD CONSTRAINT "test_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;