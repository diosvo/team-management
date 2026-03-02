ALTER TABLE "training_session" DROP CONSTRAINT "training_session_coach_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_training_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("session_id") ON DELETE set null ON UPDATE no action;