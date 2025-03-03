import { timestamp } from 'drizzle-orm/pg-core';

export const created_at = timestamp({ withTimezone: true })
  .notNull()
  .defaultNow();
export const updated_at = timestamp({ withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());
