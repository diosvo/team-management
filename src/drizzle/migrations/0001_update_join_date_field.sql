ALTER TABLE "user" ALTER COLUMN "join_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "join_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "join_date" DROP NOT NULL;