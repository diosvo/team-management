ALTER TABLE "team" RENAME COLUMN "logo_url" TO "image";--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "image" SET DATA TYPE text;
