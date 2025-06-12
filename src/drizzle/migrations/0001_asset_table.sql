CREATE TYPE "public"."asset_catogory" AS ENUM('EQUIPMENT', 'TRAINING', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."asset_condition" AS ENUM('POOR', 'FAIR', 'GOOD');--> statement-breakpoint
CREATE TABLE "asset" (
	"asset_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"category" "asset_catogory" DEFAULT 'EQUIPMENT' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition" "asset_condition" DEFAULT 'GOOD' NOT NULL,
	"note" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;