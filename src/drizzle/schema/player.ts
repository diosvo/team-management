import { relations, sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgEnum,
  pgTable,
  real,
  uuid,
} from 'drizzle-orm/pg-core';

import { PlayerPosition } from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { UserTable } from './user';

export const playerPositionEnum = pgEnum('position', PlayerPosition);

export const PlayerTable = pgTable(
  'player',
  {
    user_id: uuid('user_id')
      .notNull()
      .primaryKey()
      .references(() => UserTable.user_id, { onDelete: 'cascade' }),
    jersey_number: integer('jersey_number'),
    position: playerPositionEnum('position'),
    height: real('height'),
    weight: real('weight'),
    created_at,
    updated_at,
  },
  (table) => [
    check('jersey_number', sql`${table.jersey_number} BETWEEN 0 AND 99`),
  ]
);

export const PlayerRelations = relations(PlayerTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [PlayerTable.user_id],
    references: [UserTable.user_id],
  }),
}));

export type Player = typeof PlayerTable.$inferSelect;
