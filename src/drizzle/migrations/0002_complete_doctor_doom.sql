ALTER TABLE "test_result" DROP CONSTRAINT "test_result_type_id_test_type_type_id_fk";
--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_type_id_test_type_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."test_type"("type_id") ON DELETE restrict ON UPDATE no action;