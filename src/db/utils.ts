import { format } from 'date-fns';
import { Column, gte, SQL, sql } from 'drizzle-orm';

import { DEFAULT_DATE_FORMAT } from '@/utils/constant';

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
  return gte(column, format(new Date(), DEFAULT_DATE_FORMAT));
}
