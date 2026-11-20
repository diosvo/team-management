CREATE TYPE "public"."document_type" AS ENUM('album', 'video', 'tactic', 'file');--> statement-breakpoint
CREATE TABLE "document" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"title" varchar(96) NOT NULL,
	"url" text NOT NULL,
	"drive_id" varchar(128) NOT NULL,
	"type" "document_type" DEFAULT 'album' NOT NULL,
	"event_date" date,
	"note" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_document_drive_id" ON "document" USING btree ("team_id","drive_id");