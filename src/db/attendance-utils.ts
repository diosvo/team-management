import { and, eq, inArray, sql } from 'drizzle-orm';

import { AttendanceStatus } from '@/utils/enum';

import { AttendanceTable } from '@/drizzle/schema/attendance';
import { UserTable } from '@/drizzle/schema/user';
import type { DateRange } from '@/types/common';

import { countWhen, withinRange } from './utils';

/** Statuses that count as showing up: late still attended. */
export const ATTENDED_STATUSES: ReadonlyArray<AttendanceStatus> = [
  AttendanceStatus.ON_TIME,
  AttendanceStatus.LATE,
];

/** Statuses that count towards the total; leave doesn't. */
const COUNTED_STATUSES = [...ATTENDED_STATUSES, AttendanceStatus.ABSENT];

export const isAttended = (status: AttendanceStatus) =>
  ATTENDED_STATUSES.includes(status);

/** `TO_CHAR` over the attendance date, _e.g._ `'YYYY-MM'` for a month key. */
export function attendanceDate(format: string) {
  return sql<string>`TO_CHAR(${AttendanceTable.date}, ${format})`;
}

/** Rows for the team in the range; needs a join on `UserTable`. */
export function teamAttendanceIn(team_id: string, range: DateRange) {
  return and(
    eq(UserTable.team_id, team_id),
    withinRange(AttendanceTable.date, range),
  );
}

export function totalCountSql() {
  return countWhen(inArray(AttendanceTable.status, COUNTED_STATUSES));
}

export function attendedCountSql() {
  return countWhen(inArray(AttendanceTable.status, [...ATTENDED_STATUSES]));
}
