CREATE TYPE "public"."attendance_status" AS ENUM('ON_TIME', 'ABSENT', 'LATE');--> statement-breakpoint
CREATE TABLE "attendance" (
	"attendance_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" text NOT NULL,
	"status" "attendance_status" DEFAULT 'ON_TIME' NOT NULL,
	"date" date NOT NULL,
	"reason" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "unique_player_per_date" ON "attendance" USING btree ("player_id","date");
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;