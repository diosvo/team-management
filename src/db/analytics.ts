import { and, count, desc, eq, gte, inArray, lte, SQL, sql } from 'drizzle-orm';

import { AttendanceStatusValues } from '@/types/attendance';
import { IntervalValues } from '@/types/common';

import { LOCALE_DATE_FORMAT } from '@/utils/constant';
import { AttendanceStatus } from '@/utils/enum';
import { TIME_DURATION } from '@/utils/formatter';

import db from '@/drizzle';
import { UserTable } from '@/drizzle/schema';
import { AttendanceTable } from '@/drizzle/schema/attendance';

function toChar(format: string) {
  return sql<string>`TO_CHAR(${AttendanceTable.date}, ${format})`;
}

function populatePercentage(value: SQL<number>, total: SQL<number>) {
  return sql<number>`ROUND(${value} * 100 / ${total})`;
}

function countTotalSql(condition: SQL) {
  return sql`SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END)`.mapWith(Number);
}

function countStatusSql(status: AttendanceStatusValues) {
  return countTotalSql(sql`${AttendanceTable.status} = ${status}`);
}

export async function getTeamAttendanceHistory(
  team_id: string,
  interval: IntervalValues,
) {
  const { start, end } = TIME_DURATION[interval];

  try {
    const dateSql = toChar(LOCALE_DATE_FORMAT);
    const shortDateSql = toChar('Mon DD');
    const daySql = toChar('FMDay');

    const totalCountSql = countTotalSql(
      sql`${AttendanceTable.status} IN (${AttendanceStatus.ON_TIME}, ${AttendanceStatus.LATE}, ${AttendanceStatus.ABSENT})`,
    );
    const attendedCountSql = countTotalSql(
      sql`${AttendanceTable.status} IN (${AttendanceStatus.ON_TIME}, ${AttendanceStatus.LATE})`,
    );
    const presentRateSql = populatePercentage(attendedCountSql, totalCountSql);

    return await db
      .select({
        date: dateSql,
        short_date: shortDateSql,
        day: daySql,
        total: totalCountSql,
        on_time: countStatusSql(AttendanceStatus.ON_TIME),
        late: countStatusSql(AttendanceStatus.LATE),
        absent: countStatusSql(AttendanceStatus.ABSENT),
        attended: attendedCountSql,
        present_rate: presentRateSql,
      })
      .from(AttendanceTable)
      .where(
        and(
          eq(AttendanceTable.team_id, team_id),
          gte(AttendanceTable.date, start.toISOString()),
          lte(AttendanceTable.date, end.toISOString()),
        ),
      )
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
  const { start, end } = TIME_DURATION[interval];

  try {
    const totalCountSql = countTotalSql(
      sql`${AttendanceTable.status} IN (${AttendanceStatus.ON_TIME}, ${AttendanceStatus.LATE}, ${AttendanceStatus.ABSENT})`,
    );
    const attendedCountSql = countTotalSql(
      sql`${AttendanceTable.status} IN (${AttendanceStatus.ON_TIME}, ${AttendanceStatus.LATE})`,
    );

    const records = await db
      .select({
        player_name: UserTable.name,
        attended: attendedCountSql,
        total_sessions: totalCountSql,
        attendance_rate: populatePercentage(attendedCountSql, totalCountSql),
      })
      .from(AttendanceTable)
      .leftJoin(UserTable, eq(AttendanceTable.player_id, UserTable.id))
      .where(
        and(
          eq(AttendanceTable.team_id, team_id),
          gte(AttendanceTable.date, start.toISOString()),
          lte(AttendanceTable.date, end.toISOString()),
        ),
      )
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
  const { start, end } = TIME_DURATION[interval];

  try {
    const reasonSql = sql<string>`COALESCE(NULLIF(${AttendanceTable.reason}, ''), 'Unknown')`;

    return await db
      .select({
        name: reasonSql,
        count: count(),
        percentage: populatePercentage(count(), sql`SUM(${count()}) OVER ()`),
        color: sql<string>`CASE 
          WHEN ${reasonSql} = 'Sick' THEN '#E53E3E'
          WHEN ${reasonSql} = 'Personal' THEN '#D69E2E'
          WHEN ${reasonSql} = 'Family Emergency' THEN '#38A169'
          WHEN ${reasonSql} = 'Travel' THEN '#3182CE'
          ELSE '#D2D4D7'
        END`,
      })
      .from(AttendanceTable)
      .where(
        and(
          eq(AttendanceTable.team_id, team_id),
          inArray(AttendanceTable.status, [
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE,
          ]),
          gte(AttendanceTable.date, start.toISOString()),
          lte(AttendanceTable.date, end.toISOString()),
        ),
      )
      .groupBy(reasonSql)
      .orderBy(desc(count()))
      .limit(5);
  } catch {
    return [];
  }
}
