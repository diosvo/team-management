import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  lte,
  SQL,
  sql,
} from 'drizzle-orm';

import { AttendanceStatusValues } from '@/types/attendance';
import { IntervalValues } from '@/types/common';

import { LOCALE_DATE_FORMAT } from '@/utils/constant';
import { AttendanceStatus, SessionStatus } from '@/utils/enum';
import { TIME_DURATION } from '@/utils/formatter';

import db from '@/drizzle';
import { MatchTable, TrainingSessionTable, UserTable } from '@/drizzle/schema';
import { AttendanceTable } from '@/drizzle/schema/attendance';

import { calculatePercentage, countWhen, fromNow } from './utils';

export async function getUpcomingMatches(team_id: string) {
  try {
    return await db.query.MatchTable.findMany({
      where: and(eq(MatchTable.home_team, team_id), fromNow(MatchTable.date)),
      columns: {
        match_id: true,
        date: true,
        time: true,
      },
      with: {
        location: {
          columns: {
            name: true,
          },
        },
        league: {
          columns: {
            league_id: true,
            name: true,
          },
        },
      },
      orderBy: [asc(MatchTable.date), asc(MatchTable.time)],
      limit: 3,
    });
  } catch {
    return [];
  }
}

export async function getUpcomingSessions(team_id: string) {
  try {
    return await db.query.TrainingSessionTable.findMany({
      where: and(
        eq(TrainingSessionTable.team_id, team_id),
        eq(TrainingSessionTable.status, SessionStatus.SCHEDULED),
        fromNow(TrainingSessionTable.date),
      ),
      columns: {
        session_id: true,
        date: true,
        start_time: true,
        end_time: true,
      },
      with: {
        location: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: [
        asc(TrainingSessionTable.date),
        asc(TrainingSessionTable.start_time),
      ],
      limit: 3,
    });
  } catch {
    return [];
  }
}

export async function getTeamAttendanceHistory(
  team_id: string,
  interval: IntervalValues,
) {
  try {
    const totalCountSql = _getTotalCountSql();
    const attendedCountSql = _getAttendedCountSql();

    return await db
      .select({
        date: _toChar(LOCALE_DATE_FORMAT),
        short_date: _toChar('Mon DD'),
        day: _toChar('FMDay'),
        total: totalCountSql,
        on_time: _countStatus(AttendanceStatus.ON_TIME),
        late: _countStatus(AttendanceStatus.LATE),
        absent: _countStatus(AttendanceStatus.ABSENT),
        attended: attendedCountSql,
        present_rate: calculatePercentage(attendedCountSql, totalCountSql),
      })
      .from(AttendanceTable)
      .where(_getDateRangeFilter(team_id, interval))
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
    const totalCountSql = _getTotalCountSql();
    const attendedCountSql = _getAttendedCountSql();
    const attendanceRateSql = calculatePercentage(
      attendedCountSql,
      totalCountSql,
    );

    const baseSelect = {
      player_name: UserTable.name,
      attended: attendedCountSql,
      total_sessions: totalCountSql,
      attendance_rate: attendanceRateSql,
    };

    const _buildPlayerQuery = (
      having: (fields: typeof baseSelect) => SQL,
      order: SQL,
    ) =>
      db
        .select(baseSelect)
        .from(AttendanceTable)
        .leftJoin(UserTable, eq(AttendanceTable.player_id, UserTable.id))
        .where(_getDateRangeFilter(team_id, interval))
        .groupBy(AttendanceTable.player_id, UserTable.name)
        .having(having)
        .orderBy(order)
        .limit(3);

    const [top_performers, need_attention] = await Promise.all([
      _buildPlayerQuery(
        ({ attendance_rate }) => gte(attendance_rate, 80),
        desc(attendanceRateSql),
      ),
      _buildPlayerQuery(
        ({ attendance_rate }) => lt(attendance_rate, 50),
        asc(attendanceRateSql),
      ),
    ]);

    return { top_performers, need_attention };
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
          _getDateRangeFilter(team_id, interval),
          inArray(AttendanceTable.status, [
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE,
          ]),
        ),
      )
      .groupBy(reasonSql)
      .orderBy(desc(countSql))
      .limit(5);
  } catch {
    return [];
  }
}

//#region  Helper functions

function _toChar(format: string) {
  return sql<string>`TO_CHAR(${AttendanceTable.date}, ${format})`;
}

function _countStatus(status: AttendanceStatusValues) {
  return countWhen(eq(AttendanceTable.status, status as AttendanceStatus));
}

function _getDateRangeFilter(team_id: string, interval: IntervalValues) {
  const { start, end } = TIME_DURATION[interval];

  return and(
    eq(AttendanceTable.team_id, team_id),
    gte(AttendanceTable.date, start.toISOString()),
    lte(AttendanceTable.date, end.toISOString()),
  );
}

function _getTotalCountSql() {
  return countWhen(
    inArray(AttendanceTable.status, [
      AttendanceStatus.ON_TIME,
      AttendanceStatus.LATE,
      AttendanceStatus.ABSENT,
    ]),
  );
}

function _getAttendedCountSql() {
  return countWhen(
    inArray(AttendanceTable.status, [
      AttendanceStatus.ON_TIME,
      AttendanceStatus.LATE,
    ]),
  );
}

//#endregion
