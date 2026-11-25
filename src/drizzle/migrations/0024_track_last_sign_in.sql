ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_sign_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_sign_in_ip" text;--> statement-breakpoint
-- Backfill from sessions that still exist; everyone else fills in on their next sign-in
UPDATE "user" SET "last_sign_in_at" = "latest"."created_at", "last_sign_in_ip" = NULLIF("latest"."ip_address", '')
FROM (
  SELECT DISTINCT ON ("user_id") "user_id", "created_at", "ip_address"
  FROM "session"
  ORDER BY "user_id", "created_at" DESC
) AS "latest"
WHERE "user"."id" = "latest"."user_id";
