ALTER TYPE "public"."asset_condition" ADD VALUE 'OBSOLETE';--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "acquired_date" date;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;