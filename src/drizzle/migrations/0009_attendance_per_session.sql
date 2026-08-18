-- Attendance was unique on (player_id, date), so a player could only ever have
-- one record per day. A team that trains twice in one day had no way to record
-- the second session. Uniqueness now keys off the session, and falls back to
-- the date only for session-less records (leave requests), which have no
-- session to key off.
--
-- Two other things follow from that:
--
--   * `attendance.date` duplicated `training_session.date` with nothing keeping
--     the two equal. Instead of dropping the column (session-less records still
--     need it, and every read filters or groups by it), it becomes the child
--     half of a composite (session_id, date) foreign key: a pair that does not
--     match a real session is rejected, and rescheduling a session cascades the
--     new date down. MATCH SIMPLE skips the check while `session_id` is NULL.
--
--   * `attendance.team_id` was derivable via player -> user -> team_id, was
--     written from the *acting* user's team rather than the player's, and was
--     never indexed — so it bought no query performance to offset the risk of
--     the two paths disagreeing. Dropped.

DROP INDEX "unique_player_per_date";

ALTER TABLE "training_session" ADD CONSTRAINT "training_session_id_date_unique" UNIQUE ("session_id", "date");

-- The app has never written `attendance.session_id`, so both statements below
-- are no-ops against production data; they exist for seeded/dev databases,
-- where session-linked rows carry a date unrelated to their session.
UPDATE "attendance" a
SET "date" = ts."date"
FROM "training_session" ts
WHERE a."session_id" = ts."session_id" AND a."date" <> ts."date";

DELETE FROM "attendance"
WHERE "attendance_id" IN (
  SELECT "attendance_id"
  FROM (
    SELECT
      "attendance_id",
      row_number() OVER (
        PARTITION BY "player_id", "session_id"
        ORDER BY "created_at", "attendance_id"
      ) AS rn
    FROM "attendance"
    WHERE "session_id" IS NOT NULL
  ) ranked
  WHERE rn > 1
);

ALTER TABLE "attendance" DROP CONSTRAINT "attendance_session_id_training_session_session_id_fk";
ALTER TABLE "attendance" DROP COLUMN "team_id";

ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_date_fk"
  FOREIGN KEY ("session_id", "date") REFERENCES "public"."training_session"("session_id", "date")
  ON UPDATE cascade ON DELETE cascade;

CREATE UNIQUE INDEX "unique_player_per_session" ON "attendance" USING btree ("player_id", "session_id") WHERE "session_id" IS NOT NULL;
CREATE UNIQUE INDEX "unique_player_per_date" ON "attendance" USING btree ("player_id", "date") WHERE "session_id" IS NULL;
