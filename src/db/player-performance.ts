import { subDays } from 'date-fns';
import { and, asc, desc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import { cache } from 'react';

import type { DateRange } from '@/types/common';
import type {
  ActivityRecord,
  AttendanceOverview,
  MatchesOverview,
  MatchPerformanceRecord,
  PerformanceSummary,
  TestingOverview,
  TestTypeProgress,
} from '@/types/performance';

import {
  MATCH_AVERAGE_FIELDS,
  type MatchAverageField,
  TREND_WINDOW_DAYS,
} from '@/utils/constants';
import { toIsoDay } from '@/utils/datetime';
import {
  ActivityKind,
  AttendanceStatus,
  MatchResult,
  MatchStatus,
  SessionStatus,
} from '@/utils/enum';
import { isLowerBetter, matchResult } from '@/utils/helper';

import db from '@/drizzle';
import { AchievementTable } from '@/drizzle/schema/achievement';
import { AttendanceTable } from '@/drizzle/schema/attendance';
import { LocationTable } from '@/drizzle/schema/location';
import { MatchPlayerStatsTable, MatchTable } from '@/drizzle/schema/match';
import {
  TestResultTable,
  TestTypeTable,
} from '@/drizzle/schema/periodic-testing';
import { TeamTable } from '@/drizzle/schema/team';
import { TrainingSessionTable } from '@/drizzle/schema/training';
import { UserTable } from '@/drizzle/schema/user';

import {
  attendanceDate,
  attendedCountSql,
  isAttended,
  teamAttendanceIn,
  totalCountSql,
} from './attendance-utils';
import { calculatePercentage, withinRange } from './utils';

/*
 * Every read here is scoped to one player. Callers pass the id from the
 * session, never from the request, so a player can only ever see themselves.
 */

const EMPTY_ATTENDANCE: AttendanceOverview = {
  total: 0,
  on_time: 0,
  late: 0,
  absent: 0,
  rate: 0,
  team_rate: 0,
  current_streak: 0,
  best_streak: 0,
  trend: null,
  monthly: [],
  reasons: [],
};

const EMPTY_TESTING: TestingOverview = {
  types: [],
  tests_taken: 0,
  last_tested: null,
};

const averagesOf = (
  value: (key: MatchAverageField) => number,
): MatchesOverview['averages'] =>
  Object.fromEntries(
    MATCH_AVERAGE_FIELDS.map(({ key }) => [key, value(key)]),
  ) as MatchesOverview['averages'];

const EMPTY_HONORS: PerformanceSummary['honors'] = { count: 0, latest: null };

const EMPTY_MATCHES: MatchesOverview = {
  records: [],
  averages: averagesOf(() => 0),
};

//#region Attendance

/**
 * React `cache` compares arguments by identity, so the cached reads take the
 * range as two strings: a fresh `{ from, to }` object would never hit.
 */
export const getPlayerAttendanceOverview = (
  player_id: string,
  team_id: string,
  { from, to }: DateRange,
) => fetchAttendanceOverview(player_id, team_id, from, to);

const fetchAttendanceOverview = cache(
  async (
    player_id: string,
    team_id: string,
    start: string,
    end: string,
  ): Promise<AttendanceOverview> => {
    const range = { from: start, to: end };
    const today = toIsoDay(new Date());
    const trendStart = toIsoDay(subDays(new Date(), TREND_WINDOW_DAYS * 2));
    const monthSql = attendanceDate('YYYY-MM');
    const totalSql = totalCountSql();
    const attendedSql = attendedCountSql();

    try {
      const [rows, teamMonthly, trendRows] = await Promise.all([
        // Session-backed rows only: a leave request has no session.
        db
          .select({
            date: AttendanceTable.date,
            status: AttendanceTable.status,
            reason: AttendanceTable.reason,
          })
          .from(AttendanceTable)
          .where(
            and(
              eq(AttendanceTable.player_id, player_id),
              isNotNull(AttendanceTable.session_id),
              withinRange(AttendanceTable.date, range),
            ),
          )
          .orderBy(asc(AttendanceTable.date)),
        db
          .select({
            month: monthSql,
            total: totalSql,
            attended: attendedSql,
            rate: calculatePercentage(attendedSql, totalSql),
          })
          .from(AttendanceTable)
          .innerJoin(UserTable, eq(UserTable.id, AttendanceTable.player_id))
          .where(
            and(
              teamAttendanceIn(team_id, range),
              isNotNull(AttendanceTable.session_id),
            ),
          )
          .groupBy(monthSql),
        // Rolling window is independent of the selected date range.
        db
          .select({
            date: AttendanceTable.date,
            status: AttendanceTable.status,
          })
          .from(AttendanceTable)
          .where(
            and(
              eq(AttendanceTable.player_id, player_id),
              isNotNull(AttendanceTable.session_id),
              withinRange(AttendanceTable.date, {
                from: trendStart,
                to: today,
              }),
            ),
          ),
      ]);

      const on_time = rows.filter(
        ({ status }) => status === AttendanceStatus.ON_TIME,
      ).length;
      const late = rows.filter(
        ({ status }) => status === AttendanceStatus.LATE,
      ).length;
      const absent = rows.length - on_time - late;

      const teamTotal = teamMonthly.reduce((sum, m) => sum + m.total, 0);
      const teamAttended = teamMonthly.reduce((sum, m) => sum + m.attended, 0);

      // Player rate per month, then merged with the team's months.
      const byMonth = new Map<string, { total: number; attended: number }>();
      rows.forEach(({ date, status }) => {
        const key = date.slice(0, 7);
        const bucket = byMonth.get(key) ?? { total: 0, attended: 0 };
        bucket.total += 1;
        if (isAttended(status)) bucket.attended += 1;
        byMonth.set(key, bucket);
      });
      const months = [
        ...new Set([...byMonth.keys(), ...teamMonthly.map((m) => m.month)]),
      ].sort();
      const teamByMonth = new Map(teamMonthly.map((m) => [m.month, m.rate]));
      const monthly = months.map((month) => {
        const mine = byMonth.get(month);
        return {
          month,
          player: mine ? _rate(mine.attended, mine.total) : null,
          team: teamByMonth.get(month) ?? null,
        };
      });

      const reasons = Object.entries(
        rows
          .filter(({ status }) => status !== AttendanceStatus.ON_TIME)
          .reduce<Record<string, number>>((acc, { reason }) => {
            // An empty key collects the rows without a reason.
            const name = reason?.trim() ?? '';
            acc[name] = (acc[name] ?? 0) + 1;
            return acc;
          }, {}),
      )
        .map(([name, count]) => ({ name: name || null, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        total: rows.length,
        on_time,
        late,
        absent,
        rate: _rate(on_time + late, rows.length),
        team_rate: _rate(teamAttended, teamTotal),
        ..._streaks(rows.map(({ status }) => status)),
        trend: _trend(trendRows),
        monthly,
        reasons,
      };
    } catch {
      return EMPTY_ATTENDANCE;
    }
  },
);

//#endregion

//#region Testing

/** Distinct testing days and the latest one, without the per-type detail. */
export async function getPlayerTestingSummary(
  player_id: string,
): Promise<Pick<TestingOverview, 'tests_taken' | 'last_tested'>> {
  try {
    const [row] = await db
      .select({
        tests_taken:
          sql<number>`COUNT(DISTINCT ${TestResultTable.date})`.mapWith(Number),
        last_tested: sql<Nullable<string>>`MAX(${TestResultTable.date})`,
      })
      .from(TestResultTable)
      .where(eq(TestResultTable.player_id, player_id));

    return {
      tests_taken: row?.tests_taken ?? 0,
      last_tested: row?.last_tested ?? null,
    };
  } catch {
    return { tests_taken: 0, last_tested: null };
  }
}

/** All-time: tests are sparse, so a date-range filter would usually be empty. */
export const getPlayerTestingOverview = cache(
  async (player_id: string, team_id: string): Promise<TestingOverview> => {
    try {
      const mine = await db
        .select({
          type_id: TestResultTable.type_id,
          name: TestTypeTable.name,
          unit: TestTypeTable.unit,
          date: TestResultTable.date,
          result: TestResultTable.result,
        })
        .from(TestResultTable)
        .innerJoin(
          TestTypeTable,
          eq(TestTypeTable.type_id, TestResultTable.type_id),
        )
        .where(eq(TestResultTable.player_id, player_id))
        .orderBy(asc(TestResultTable.date), asc(TestTypeTable.name));

      if (mine.length === 0) return EMPTY_TESTING;

      const typeIds = [...new Set(mine.map(({ type_id }) => type_id))];

      // Everyone on the team, for the same types: feeds the team average per
      // testing date and the percentile on the latest date.
      const team = await db
        .select({
          type_id: TestResultTable.type_id,
          date: TestResultTable.date,
          player_id: TestResultTable.player_id,
          result: TestResultTable.result,
        })
        .from(TestResultTable)
        .innerJoin(UserTable, eq(UserTable.id, TestResultTable.player_id))
        .where(
          and(
            eq(UserTable.team_id, team_id),
            inArray(TestResultTable.type_id, typeIds),
          ),
        );

      const teamByKey = new Map<
        string,
        Array<{ player_id: string; result: number }>
      >();
      team.forEach(({ type_id, date, player_id: pid, result }) => {
        const key = `${type_id}|${date}`;
        const list = teamByKey.get(key) ?? [];
        list.push({ player_id: pid, result: Number(result) });
        teamByKey.set(key, list);
      });

      const byType = new Map<string, typeof mine>();
      mine.forEach((row) => {
        const list = byType.get(row.type_id) ?? [];
        list.push(row);
        byType.set(row.type_id, list);
      });

      const types: Array<TestTypeProgress> = [...byType.values()].map(
        (rows) => {
          const { type_id, name, unit } = rows[0];
          const lower_is_better = isLowerBetter(unit);

          const series = rows.map(({ date, result }) => {
            const peers = teamByKey.get(`${type_id}|${date}`) ?? [];
            return {
              date,
              result: Number(result),
              team_avg: peers.length
                ? _round(_avg(peers.map((p) => p.result)))
                : null,
            };
          });

          const latest = series[series.length - 1];
          const previous = series.at(-2);
          const others = (
            teamByKey.get(`${type_id}|${latest.date}`) ?? []
          ).filter((p) => p.player_id !== player_id);
          const beaten = others.filter((p) =>
            lower_is_better
              ? p.result > latest.result
              : p.result < latest.result,
          ).length;

          return {
            type_id,
            name,
            unit,
            lower_is_better,
            latest: {
              date: latest.date,
              result: latest.result,
              improvement_pct: previous
                ? _improvement(latest.result, previous.result, lower_is_better)
                : null,
              team_avg: latest.team_avg,
              percentile: others.length
                ? Math.round((beaten / others.length) * 100)
                : null,
            },
            series,
          };
        },
      );

      const dates = [...new Set(mine.map(({ date }) => date))].sort();

      return {
        types: types.sort((a, b) => a.name.localeCompare(b.name)),
        tests_taken: dates.length,
        last_tested: dates[dates.length - 1],
      };
    } catch {
      return EMPTY_TESTING;
    }
  },
);

//#endregion

//#region Matches

const fetchPlayerMatchRows = (
  player_id: string,
  team_id: string,
  { from, to }: DateRange,
) => fetchMatchRows(player_id, team_id, from, to);

const fetchMatchRows = cache(
  async (
    player_id: string,
    team_id: string,
    start: string,
    end: string,
  ): Promise<Array<MatchPerformanceRecord>> => {
    const range = { from: start, to: end };

    const rows = await db
      .select({
        match_id: MatchPlayerStatsTable.match_id,
        date: MatchTable.date,
        home_team_score: MatchTable.home_team_score,
        away_team_score: MatchTable.away_team_score,
        opponent: TeamTable.name,
        points_scored: MatchPlayerStatsTable.points_scored,
        rebounds: MatchPlayerStatsTable.rebounds,
        assists: MatchPlayerStatsTable.assists,
        steals: MatchPlayerStatsTable.steals,
        blocks: MatchPlayerStatsTable.blocks,
        turnovers: MatchPlayerStatsTable.turnovers,
        fouls: MatchPlayerStatsTable.fouls,
      })
      .from(MatchPlayerStatsTable)
      .innerJoin(
        MatchTable,
        eq(MatchTable.match_id, MatchPlayerStatsTable.match_id),
      )
      .innerJoin(TeamTable, eq(TeamTable.team_id, MatchTable.away_team))
      .where(
        and(
          eq(MatchPlayerStatsTable.player_id, player_id),
          // Rows the player recorded for this team, on matches actually played.
          eq(MatchPlayerStatsTable.team_id, team_id),
          eq(MatchTable.home_team, team_id),
          eq(MatchTable.status, MatchStatus.COMPLETED),
          withinRange(MatchTable.date, range),
        ),
      )
      .orderBy(asc(MatchTable.date), asc(MatchTable.time));

    return rows.map(({ home_team_score, away_team_score, ...row }) => ({
      ...row,
      steals: row.steals ?? 0,
      blocks: row.blocks ?? 0,
      turnovers: row.turnovers ?? 0,
      fouls: row.fouls ?? 0,
      score: `${home_team_score} - ${away_team_score}`,
      result: matchResult(home_team_score, away_team_score),
    }));
  },
);

export async function getPlayerMatchesOverview(
  player_id: string,
  team_id: string,
  range: DateRange,
): Promise<MatchesOverview> {
  try {
    const records = await fetchPlayerMatchRows(player_id, team_id, range);
    if (records.length === 0) return EMPTY_MATCHES;

    return {
      records,
      averages: averagesOf((key) => _round(_avg(records.map((r) => r[key])))),
    };
  } catch {
    return EMPTY_MATCHES;
  }
}

//#endregion

//#region Activity

export async function getPlayerActivity(
  player_id: string,
  team_id: string,
  range: DateRange,
): Promise<Array<ActivityRecord>> {
  const { from: start, to: end } = range;
  // Only what has happened: no scheduled or cancelled sessions.
  const today = toIsoDay(new Date());
  const until = end < today ? end : today;

  try {
    const [sessions, tests, matches] = await Promise.all([
      db
        .select({
          session_id: TrainingSessionTable.session_id,
          date: TrainingSessionTable.date,
          start_time: TrainingSessionTable.start_time,
          end_time: TrainingSessionTable.end_time,
          location: LocationTable.name,
          status: AttendanceTable.status,
          reason: AttendanceTable.reason,
        })
        .from(TrainingSessionTable)
        .leftJoin(
          LocationTable,
          eq(LocationTable.location_id, TrainingSessionTable.location_id),
        )
        .leftJoin(
          AttendanceTable,
          and(
            eq(AttendanceTable.session_id, TrainingSessionTable.session_id),
            eq(AttendanceTable.player_id, player_id),
          ),
        )
        .where(
          and(
            eq(TrainingSessionTable.team_id, team_id),
            ne(TrainingSessionTable.status, SessionStatus.CANCELLED),
            withinRange(TrainingSessionTable.date, { from: start, to: until }),
          ),
        ),
      db
        .select({
          date: TestResultTable.date,
          name: TestTypeTable.name,
          unit: TestTypeTable.unit,
          result: TestResultTable.result,
        })
        .from(TestResultTable)
        .innerJoin(
          TestTypeTable,
          eq(TestTypeTable.type_id, TestResultTable.type_id),
        )
        .where(
          and(
            eq(TestResultTable.player_id, player_id),
            withinRange(TestResultTable.date, range),
          ),
        )
        .orderBy(asc(TestTypeTable.name)),
      fetchPlayerMatchRows(player_id, team_id, range),
    ]);

    const trainingRecords: Array<ActivityRecord> = sessions.map((s) => ({
      id: s.session_id,
      date: s.date,
      kind: ActivityKind.TRAINING,
      location: s.location ?? null,
      duration_hours: _durationHours(s.start_time, s.end_time),
      status: s.status ?? null,
      reason: s.reason ?? null,
    }));

    const testsByDate = new Map<string, typeof tests>();
    tests.forEach((t) => {
      const list = testsByDate.get(t.date) ?? [];
      list.push(t);
      testsByDate.set(t.date, list);
    });
    const testRecords: Array<ActivityRecord> = [...testsByDate].map(
      ([date, list]) => ({
        id: `test-${date}`,
        date,
        kind: ActivityKind.TEST,
        results: list.map(({ name, result, unit }) => ({
          name,
          result: Number(result),
          unit,
        })),
      }),
    );

    const matchRecords: Array<ActivityRecord> = matches.map((m) => ({
      id: m.match_id,
      date: m.date,
      kind: ActivityKind.MATCH,
      opponent: m.opponent,
      result: m.result,
      score: m.score,
      points_scored: m.points_scored,
      rebounds: m.rebounds,
      assists: m.assists,
    }));

    return [...trainingRecords, ...testRecords, ...matchRecords].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  } catch {
    return [];
  }
}

//#endregion

//#region Honors

/** How many honors the player holds, and the most recent one. */
export async function getPlayerHonorSummary(
  player_id: string,
): Promise<PerformanceSummary['honors']> {
  try {
    const [latest] = await db
      .select({
        type: AchievementTable.type,
        year: AchievementTable.year,
        count: sql<number>`COUNT(*) OVER ()`.mapWith(Number),
      })
      .from(AchievementTable)
      .where(eq(AchievementTable.player_id, player_id))
      .orderBy(desc(AchievementTable.year), desc(AchievementTable.created_at))
      .limit(1);

    return latest
      ? {
          count: latest.count,
          latest: { type: latest.type, year: latest.year },
        }
      : EMPTY_HONORS;
  } catch {
    return EMPTY_HONORS;
  }
}

//#endregion

//#region Helpers

function _rate(attended: number, total: number) {
  return total ? _round((attended / total) * 100) : 0;
}

function _round(value: number) {
  return Math.round(value * 10) / 10;
}

function _avg(values: Array<number>) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Runs of attended sessions over rows sorted by date ascending. */
function _streaks(statuses: Array<AttendanceStatus>) {
  let current = 0;
  let best = 0;
  statuses.forEach((status) => {
    current = isAttended(status) ? current + 1 : 0;
    best = Math.max(best, current);
  });
  return { current_streak: current, best_streak: best };
}

function _trend(rows: Array<{ date: string; status: AttendanceStatus }>) {
  const pivot = toIsoDay(subDays(new Date(), TREND_WINDOW_DAYS));
  const recent = rows.filter(({ date }) => date > pivot);
  const previous = rows.filter(({ date }) => date <= pivot);
  if (recent.length === 0 || previous.length === 0) return null;

  const rateOf = (list: typeof rows) =>
    _rate(list.filter(({ status }) => isAttended(status)).length, list.length);
  const r = rateOf(recent);
  const p = rateOf(previous);
  return { recent: r, previous: p, delta: _round(r - p) };
}

/** Percent change, flipped for lower-is-better units so "+" is always good. */
function _improvement(
  latest: number,
  previous: number,
  lowerIsBetter: boolean,
) {
  if (previous === 0) return null;
  const change = ((latest - previous) / Math.abs(previous)) * 100;
  return _round(lowerIsBetter ? -change : change);
}

/** Session length in hours, rounded to one decimal. */
function _durationHours(start: string, end: string) {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const minutes = toMinutes(end) - toMinutes(start);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return _round(minutes / 60);
}

//#endregion
