import { timestamp } from 'drizzle-orm/pg-core';

export const created_at = timestamp('created_at', { withTimezone: true })
  .notNull()
  .defaultNow();
export const updated_at = timestamp('updated_at', { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());
export const expires_at = timestamp('expires_at', {
  withTimezone: true,
}).notNull();
