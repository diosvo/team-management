DO $$ BEGIN
	CREATE TYPE "public"."report_frequency" AS ENUM('weekly', 'monthly', 'quarterly');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."report_interval" AS ENUM('this_month', 'last_month', 'this_year', 'last_year');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."report_status" AS ENUM('pending', 'success', 'failed', 'expired');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."report_trigger" AS ENUM('manual', 'scheduled');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_history" (
	"report_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"schedule_id" uuid,
	"scheduled_for" timestamp with time zone,
	"interval" "report_interval" NOT NULL,
	"period" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"trigger" "report_trigger" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"pathname" text,
	"filename" text,
	"resend_email_id" text,
	"delivery_status" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_schedule" (
	"schedule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"interval" "report_interval" NOT NULL,
	"frequency" "report_frequency" NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"recipients" text[] DEFAULT '{}' NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"last_run_at" timestamp with time zone,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_schedule_team_id_interval_unique" UNIQUE("team_id","interval")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "report_history" ADD CONSTRAINT "report_history_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "report_history" ADD CONSTRAINT "report_history_schedule_id_report_schedule_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."report_schedule"("schedule_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "report_schedule" ADD CONSTRAINT "report_schedule_team_id_team_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_report_run_occurrence" ON "report_history" USING btree ("schedule_id","scheduled_for");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_report_schedule_due" ON "report_schedule" USING btree ("next_run_at") WHERE enabled = true;