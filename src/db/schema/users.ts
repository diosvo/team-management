import {
  AnyPgColumn,
  integer,
  pgEnum,
  pgTable as table,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const rolesEnum = pgEnum('roles', ['guest', 'user', 'admin']);

export const users = table(
  'users',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    firstName: varchar('first_name', { length: 256 }),
    lastName: varchar('last_name', { length: 256 }),
    email: varchar().notNull(),
    invitee: integer().references((): AnyPgColumn => users.id),
    role: rolesEnum().default('guest'),
  },
  (table) => [uniqueIndex('email_idx').on(table.email)]
);
