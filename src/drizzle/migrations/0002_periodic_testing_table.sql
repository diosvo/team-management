CREATE TYPE "public"."test_type_unit" AS ENUM('meters', 'percent', 'points', 'reps', 'seconds', 'times');--> statement-breakpoint
CREATE TABLE "test_result" (
	"result_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type_id" uuid NOT NULL,
	"result" numeric(10, 3) NOT NULL,
	"date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_type" (
	"type_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"unit" "test_type_unit" DEFAULT 'times' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_type_id_test_type_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."test_type"("type_id") ON DELETE cascade ON UPDATE no action;