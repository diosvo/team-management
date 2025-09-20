import { timestamp } from 'drizzle-orm/pg-core';

export const created_at = timestamp('create_at', { withTimezone: true })
  .notNull()
  .defaultNow();
export const updated_at = timestamp('update_at', { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());
export const expires_at = timestamp('expires_at', {
  withTimezone: true,
}).notNull();
