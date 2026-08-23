ALTER TABLE "asset" DROP CONSTRAINT "asset_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "team_asset_name" ON "asset" USING btree ("team_id","name");