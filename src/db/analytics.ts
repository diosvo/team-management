import { cache } from 'react';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  type SQL,
  sql,
} from 'drizzle-orm';

import { LOCALE_DATE_FORMAT } from '@/utils/constants';
import { AttendanceStatus, MatchStatus, SessionStatus } from '@/utils/enum';

import db from '@/drizzle';
import { MatchTable, TrainingSessionTable, UserTable } from '@/drizzle/schema';
import { AttendanceTable } from '@/drizzle/schema/attendance';
import type { AttendanceStatusValues } from '@/types/attendance';
import type { DateRange } from '@/types/common';

import {
  attendanceDate,
  attendedCountSql,
  teamAttendanceIn,
  totalCountSql,
} from './attendance-utils';
import { calculatePercentage, countWhen, fromNow } from './utils';

// Request-scoped: the overview stats and the upcoming-matches card both ask
// for this during one dashboard render.
export const selectUpcomingMatches = cache(async (team_id: string) => {
  try {
    return await db.query.MatchTable.findMany({
      where: and(
        eq(MatchTable.home_team, team_id),
        eq(MatchTable.status, MatchStatus.SCHEDULED),
        fromNow(MatchTable.date),
      ),
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
});

export async function selectUpcomingSessions(team_id: string) {
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

export async function selectTeamAttendanceHistory(
  team_id: string,
  range: DateRange,
) {
  try {
    const totalSql = totalCountSql();
    const attendedSql = attendedCountSql();

    return await db
      .select({
        date: attendanceDate(LOCALE_DATE_FORMAT),
        short_date: attendanceDate('Mon DD'),
        day: attendanceDate('FMDay'),
        total: totalSql,
        on_time: _countStatus(AttendanceStatus.ON_TIME),
        late: _countStatus(AttendanceStatus.LATE),
        absent: _countStatus(AttendanceStatus.ABSENT),
        attended: attendedSql,
        present_rate: calculatePercentage(attendedSql, totalSql),
      })
      .from(AttendanceTable)
      .innerJoin(UserTable, eq(UserTable.id, AttendanceTable.player_id))
      .where(teamAttendanceIn(team_id, range))
      .groupBy(AttendanceTable.date)
      .orderBy(desc(AttendanceTable.date));
  } catch {
    return [];
  }
}

export async function selectPlayersAttendanceSummary(
  team_id: string,
  range: DateRange,
) {
  try {
    const totalSql = totalCountSql();
    const attendedSql = attendedCountSql();
    const attendanceRateSql = calculatePercentage(attendedSql, totalSql);

    const baseSelect = {
      player_name: UserTable.name,
      attended: attendedSql,
      total_sessions: totalSql,
      attendance_rate: attendanceRateSql,
    };

    const _buildPlayerQuery = (
      having: (fields: typeof baseSelect) => SQL,
      order: SQL,
    ) =>
      db
        .select(baseSelect)
        .from(AttendanceTable)
        .innerJoin(UserTable, eq(UserTable.id, AttendanceTable.player_id))
        .where(teamAttendanceIn(team_id, range))
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

export async function selectMostCommonAbsenceReasons(
  team_id: string,
  range: DateRange,
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
      .innerJoin(UserTable, eq(UserTable.id, AttendanceTable.player_id))
      .where(
        and(
          teamAttendanceIn(team_id, range),
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

function _countStatus(status: AttendanceStatusValues) {
  return countWhen(eq(AttendanceTable.status, status as AttendanceStatus));
}

//#endregion
