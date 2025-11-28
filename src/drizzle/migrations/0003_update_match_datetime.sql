ALTER TABLE "match" ADD COLUMN "date" date;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "time" time with time zone;--> statement-breakpoint
UPDATE "match" SET "date" = "datetime"::date, "time" = "datetime"::time with time zone WHERE "datetime" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "datetime";--> statement-breakpoint
