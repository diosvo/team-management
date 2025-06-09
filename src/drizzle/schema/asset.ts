import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

import { AssetCategory, AssetCondition } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { TeamTable } from './team';

export const assetConditionEnum = pgEnum('asset_condition', AssetCondition);

export const assetCategoryEnum = pgEnum('asset_catogory', AssetCategory);

export const AssetTable = pgTable('asset', {
  asset_id: uuid().primaryKey().defaultRandom(),
  team_id: uuid()
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  name: varchar({ length: 128 }).notNull(),
  category: assetCategoryEnum().default(AssetCategory.EQUIPMENT).notNull(),
  quantity: integer().notNull().default(1),
  condition: assetConditionEnum().default(AssetCondition.GOOD).notNull(),
  note: varchar({ length: 256 }),
  created_at,
  updated_at,
});

export const AssetRelations = relations(AssetTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [AssetTable.team_id],
    references: [TeamTable.team_id],
  }),
}));

export type Asset = Omit<
  typeof AssetTable.$inferSelect,
  'team_id' | 'created_at'
>;
export type InsertAsset = typeof AssetTable.$inferInsert;
