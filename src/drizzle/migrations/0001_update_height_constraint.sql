ALTER TABLE "player" DROP CONSTRAINT "height";--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "height" CHECK ("player"."height" BETWEEN 0 AND 200);