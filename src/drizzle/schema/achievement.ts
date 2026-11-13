import { relations, sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { AchievementType, enumValues } from '@/utils/enum';

import { LeagueTable } from './league';
import { PlayerTable } from './player';
import { TeamTable } from './team';

import { created_at, updated_at } from '../helpers';

export const achievementTypeEnum = pgEnum(
  'achievement_type',
  enumValues(AchievementType),
);

export const AchievementTable = pgTable(
  'achievement',
  {
    achievement_id: uuid().primaryKey().defaultRandom(),
    // Owning team; every read and write is scoped to the session team.
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    type: achievementTypeEnum().notNull(),
    // Only a custom honor needs its own title. Otherwise null means "show the
    // type's label", translated at read time so it follows the UI locale.
    title: varchar({ length: 128 }),
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
    check(
      'custom_achievement_has_title',
      sql`${table.type} != 'custom' OR ${table.title} IS NOT NULL`,
    ),
    // One honor of each type per league and team, except "custom" which may repeat
    uniqueIndex('achievement_team_league_type_idx')
      .on(table.team_id, table.league_id, table.type)
      .where(sql`${table.league_id} IS NOT NULL AND ${table.type} != 'custom'`),
  ],
);

export const AchievementRelations = relations(AchievementTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [AchievementTable.team_id],
    references: [TeamTable.team_id],
  }),
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
