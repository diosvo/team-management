import { between, Column, gte, SQL, sql } from 'drizzle-orm';

import type { DateRange } from '@/types/common';
import { toIsoDay } from '@/utils/datetime';

export function calculatePercentage(value: SQL<number>, total: SQL<number>) {
  return sql<number>`ROUND((${value} * 100.0 / NULLIF(${total}, 0))::numeric, 1)`.mapWith(
    Number,
  );
}

export function countWhen(condition: SQL) {
  return sql<number>`SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END)`.mapWith(
    Number,
  );
}

export function fromNow(column: Column) {
  return gte(column, toIsoDay(new Date()));
}

/** Inclusive ISO-day window on a `date` column. */
export function withinRange(column: Column, { from, to }: DateRange) {
  return between(column, from, to);
}
