import { relations } from 'drizzle-orm';
import {
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { AssetCategory, AssetCondition } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { TeamTable } from './team';
import { User, UserTable } from './user';

export const assetConditionEnum = pgEnum('asset_condition', AssetCondition);

export const assetCategoryEnum = pgEnum('asset_catogory', AssetCategory);

export const AssetTable = pgTable('asset', {
  asset_id: uuid().primaryKey().defaultRandom(),
  team_id: uuid()
    .notNull()
    .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
  name: varchar({ length: 64 }).unique().notNull(),
  assigned_to: text().references(() => UserTable.id, { onDelete: 'set null' }),
  acquired_date: date(),
  category: assetCategoryEnum().default(AssetCategory.EQUIPMENT).notNull(),
  quantity: integer().notNull().default(1),
  condition: assetConditionEnum().default(AssetCondition.GOOD).notNull(),
  note: varchar({ length: 128 }),
  created_at,
  updated_at,
});

export const AssetRelations = relations(AssetTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [AssetTable.team_id],
    references: [TeamTable.team_id],
  }),
  user: one(UserTable, {
    fields: [AssetTable.assigned_to],
    references: [UserTable.id],
  }),
}));

export type Asset = typeof AssetTable.$inferSelect & {
  user: Nullable<Pick<User, 'name'>>;
};
export type NullishAsset = Nullish<Asset>;
export type InsertAsset = typeof AssetTable.$inferInsert;
