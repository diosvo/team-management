import {
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Enums

export const userRolesEnum = pgEnum('user_roles', [
  'SUPER_ADMIN',
  'COACH',
  'PLAYER',
  'CAPTAIN',
]);
export const userStateEnum = pgEnum('user_state', [
  'UNKNOWN',
  'ACTIVE',
  'INACTIVE',
  'TEMPORARILY_ABSENT',
]);

// Table

export const user = pgTable(
  'users',
  {
    user_id: uuid('user_id').primaryKey().defaultRandom(),
    full_name: varchar('full_name', { length: 128 }).notNull(),
    dob: date('dob').notNull(),
    username: varchar('username').notNull(),
    password: varchar('password', { length: 128 }).notNull(),
    email: varchar('email'),
    phone_number: varchar('phone_number', { length: 15 }),
    roles: userRolesEnum('roles').array(),
    avatar: text('avatar'),
    join_date: timestamp('join_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
    state: userStateEnum('state').default('ACTIVE').notNull(),
  },
  (table) => [
    uniqueIndex('email_idx').on(table.email),
    uniqueIndex('username_idx').on(table.username),
  ]
);
