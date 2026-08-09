import { relations, sql } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { AchievementType, enumValues } from '@/utils/enum';
import { created_at, updated_at } from '../helpers';

import { LeagueTable } from './league';
import { PlayerTable } from './player';

export const achievementTypeEnum = pgEnum(
  'achievement_type',
  enumValues(AchievementType),
);

export const AchievementTable = pgTable(
  'achievement',
  {
    achievement_id: uuid().primaryKey().defaultRandom(),
    type: achievementTypeEnum().notNull(),
    title: varchar({ length: 128 }).notNull(),
    year: integer().notNull(),
    // "set null" so the honor survives deletion of its league record
    league_id: uuid().references(() => LeagueTable.league_id, {
      onDelete: 'set null',
    }),
    // Awarded player for individual honors (MVP, Top Scorer)
    player_id: text().references(() => PlayerTable.id, {
      onDelete: 'set null',
    }),
    description: varchar({ length: 256 }),
    created_at,
    updated_at,
  },
  (table) => [
    // One honor of each type per league, except "custom" which may repeat
    uniqueIndex('achievement_league_type_idx')
      .on(table.league_id, table.type)
      .where(sql`${table.league_id} IS NOT NULL AND ${table.type} != 'custom'`),
  ],
);

export const AchievementRelations = relations(AchievementTable, ({ one }) => ({
  league: one(LeagueTable, {
    fields: [AchievementTable.league_id],
    references: [LeagueTable.league_id],
  }),
  player: one(PlayerTable, {
    fields: [AchievementTable.player_id],
    references: [PlayerTable.id],
  }),
}));

export type Achievement = typeof AchievementTable.$inferSelect;
export type InsertAchievement = typeof AchievementTable.$inferInsert;
