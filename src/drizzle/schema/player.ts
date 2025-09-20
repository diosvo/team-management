import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { PlayerPosition } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { UserTable } from './user';

export const playerPositionEnum = pgEnum('player_position', PlayerPosition);

export const PlayerTable = pgTable(
  'player',
  {
    id: text()
      .notNull()
      .primaryKey()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
    is_captain: boolean().default(false).notNull(),
    jersey_number: integer().unique(),
    position: playerPositionEnum().default(PlayerPosition.UNKNOWN),
    height: integer(),
    weight: integer(),
    created_at,
    updated_at,
  },
  (table) => [
    check('jersey_number', sql`${table.jersey_number} BETWEEN 0 AND 99`),
    check('height', sql`${table.height} BETWEEN 0 AND 200`),
    check('weight', sql`${table.weight} BETWEEN 0 AND 100`),
    // Ensure that there is only one captain in team
    uniqueIndex('team_captain')
      .on(table.id)
      .where(sql`${table.is_captain} = true`),
  ]
);

export const PlayerRelations = relations(PlayerTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [PlayerTable.id],
    references: [UserTable.id],
  }),
}));

export type Player = typeof PlayerTable.$inferSelect;
export type InsertPlayer = typeof PlayerTable.$inferInsert;
