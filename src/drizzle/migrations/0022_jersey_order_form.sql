CREATE TYPE "public"."jersey_size" AS ENUM('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL');--> statement-breakpoint
CREATE TYPE "public"."short_form" AS ENUM('short', 'standard');--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "jersey_name" varchar(20);--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "shirt_size" "jersey_size";--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "short_size" "jersey_size";--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "short_form" "short_form";--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "uniform_order_spreadsheet_id" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "uniform_order_updated_at" timestamp with time zone;