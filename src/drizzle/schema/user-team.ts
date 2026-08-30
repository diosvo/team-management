import { relations, sql } from 'drizzle-orm';
import {
  check,
  date,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { created_at, updated_at } from '../helpers';
import { TeamTable } from './team';
import { UserTable } from './user';

/**
 * One row per stint a user spends on a team. A transfer closes the current row
 * (`leave_date`) and opens a new one; a rejoin opens another row for the same
 * team. `user.team_id` stays as the denormalized pointer to the open stint —
 * every read path filters on it, so it is kept in sync rather than derived.
 */
export const UserTeamTable = pgTable(
  'user_team',
  {
    user_team_id: uuid().primaryKey().defaultRandom(),
    user_id: text()
      .notNull()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    join_date: date().notNull(),
    leave_date: date(),
    created_at,
    updated_at,
  },
  (table) => [
    check(
      'membership_dates',
      sql`${table.leave_date} IS NULL OR ${table.leave_date} >= ${table.join_date}`,
    ),
    // A user is on at most one team at a time: only one open stint may exist.
    uniqueIndex('user_current_team')
      .on(table.user_id)
      .where(sql`${table.leave_date} IS NULL`),
    // Rejoining is allowed, starting the same stint twice is not.
    unique('user_team_stint').on(table.user_id, table.team_id, table.join_date),
  ],
);

export const UserTeamRelations = relations(UserTeamTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [UserTeamTable.user_id],
    references: [UserTable.id],
  }),
  team: one(TeamTable, {
    fields: [UserTeamTable.team_id],
    references: [TeamTable.team_id],
  }),
}));

export type UserTeam = typeof UserTeamTable.$inferSelect;
export type InsertUserTeam = typeof UserTeamTable.$inferInsert;
