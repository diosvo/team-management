import { and, count, desc, eq, gte, inArray, lte, SQL, sql } from 'drizzle-orm';

import { AttendanceStatusValues } from '@/types/attendance';
import { IntervalValues } from '@/types/common';

import { LOCALE_DATE_FORMAT } from '@/utils/constant';
import { AttendanceStatus } from '@/utils/enum';
import { TIME_DURATION } from '@/utils/formatter';

import db from '@/drizzle';
import { UserTable } from '@/drizzle/schema';
import { AttendanceTable } from '@/drizzle/schema/attendance';

const COUNTED_STATUSES = [
  AttendanceStatus.ON_TIME,
  AttendanceStatus.LATE,
  AttendanceStatus.ABSENT,
] as const;
const ATTENDED_STATUSES = [
  AttendanceStatus.ON_TIME,
  AttendanceStatus.LATE,
] as const;
const REASON_STATUSES = [
  AttendanceStatus.ABSENT,
  AttendanceStatus.LATE,
] as const;

function toChar(format: string) {
  return sql<string>`TO_CHAR(${AttendanceTable.date}, ${format})`;
}

function calculatePercentage(value: SQL<number>, total: SQL<number>) {
  return sql<number>`ROUND((${value} * 100.0 / NULLIF(${total}, 0))::numeric, 1)`.mapWith(
    Number,
  );
}

function countWhen(condition: SQL) {
  return sql<number>`SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END)`.mapWith(
    Number,
  );
}

function countStatus(status: AttendanceStatusValues) {
  return countWhen(eq(AttendanceTable.status, status as AttendanceStatus));
}

function getDateRangeFilter(team_id: string, interval: IntervalValues) {
  const { start, end } = TIME_DURATION[interval];

  return and(
    eq(AttendanceTable.team_id, team_id),
    gte(AttendanceTable.date, start.toISOString()),
    lte(AttendanceTable.date, end.toISOString()),
  );
}

function getTotalCountSql() {
  return countWhen(inArray(AttendanceTable.status, COUNTED_STATUSES));
}

function getAttendedCountSql() {
  return countWhen(inArray(AttendanceTable.status, ATTENDED_STATUSES));
}

export async function getTeamAttendanceHistory(
  team_id: string,
  interval: IntervalValues,
) {
  try {
    const totalCountSql = getTotalCountSql();
    const attendedCountSql = getAttendedCountSql();

    return await db
      .select({
        date: toChar(LOCALE_DATE_FORMAT),
        short_date: toChar('Mon DD'),
        day: toChar('FMDay'),
        total: totalCountSql,
        on_time: countStatus(AttendanceStatus.ON_TIME),
        late: countStatus(AttendanceStatus.LATE),
        absent: countStatus(AttendanceStatus.ABSENT),
        attended: attendedCountSql,
        present_rate: calculatePercentage(attendedCountSql, totalCountSql),
      })
      .from(AttendanceTable)
      .where(getDateRangeFilter(team_id, interval))
      .groupBy(AttendanceTable.date)
      .orderBy(desc(AttendanceTable.date));
  } catch {
    return [];
  }
}

export async function getPlayersAttendanceSummary(
  team_id: string,
  interval: IntervalValues,
) {
  try {
    const totalCountSql = getTotalCountSql();
    const attendedCountSql = getAttendedCountSql();

    const records = await db
      .select({
        player_name: UserTable.name,
        attended: attendedCountSql,
        total_sessions: totalCountSql,
        attendance_rate: calculatePercentage(attendedCountSql, totalCountSql),
      })
      .from(AttendanceTable)
      .leftJoin(UserTable, eq(AttendanceTable.player_id, UserTable.id))
      .where(getDateRangeFilter(team_id, interval))
      .groupBy(AttendanceTable.player_id, UserTable.name);

    return {
      top_performers: records
        .filter(({ attendance_rate }) => attendance_rate >= 80)
        .slice(0, 3),
      need_attention: records
        .filter(({ attendance_rate }) => attendance_rate < 50)
        .slice(0, 3),
    };
  } catch {
    return {
      top_performers: [],
      need_attention: [],
    };
  }
}

export async function getMostCommonAbsenceReasons(
  team_id: string,
  interval: IntervalValues,
) {
  try {
    const reasonSql = sql<string>`COALESCE(NULLIF(${AttendanceTable.reason}, ''), 'Unknown')`;
    const countSql = count();

    return await db
      .select({
        name: reasonSql,
        count: countSql,
        percentage: calculatePercentage(
          countSql,
          sql`SUM(${countSql}) OVER ()`,
        ),
      })
      .from(AttendanceTable)
      .where(
        and(
          getDateRangeFilter(team_id, interval),
          inArray(AttendanceTable.status, REASON_STATUSES),
        ),
      )
      .groupBy(reasonSql)
      .orderBy(desc(countSql))
      .limit(5);
  } catch {
    return [];
  }
}
