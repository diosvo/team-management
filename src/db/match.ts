import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
} from 'drizzle-orm';

import type { DataWithStats } from '@/types/common';
import type { MatchStats, MatchWithTeams } from '@/types/match';

import type { MatchSearchParams } from '@/lib/nuqs';
import { MatchResult, MatchStatus, MatchType } from '@/utils/enum';

import db from '@/drizzle';
import { type InsertMatch, MatchTable } from '@/drizzle/schema';
import type { UpsertMatchSchemaValues } from '@/schemas/match';
import { withinRange } from './utils';

export async function getMatches(
  params: MatchSearchParams & { team_id: string },
): Promise<DataWithStats<MatchWithTeams, MatchStats>> {
  const { game_type, from, to, match_type, status, team_id } = params;

  try {
    const matches = await db.query.MatchTable.findMany({
      with: {
        home_team: { columns: { team_id: true, name: true } },
        away_team: { columns: { team_id: true, name: true } },
        league: { columns: { name: true } },
        location: { columns: { name: true } },
      },
      where: and(
        eq(MatchTable.home_team, team_id),
        // Empty or both options selected → no condition; exactly one → narrow.
        ...(game_type.length === 1
          ? [eq(MatchTable.is_5x5, game_type[0] === 'true')]
          : []),
        withinRange(MatchTable.date, { from, to }),
        ...(match_type.length === 1 && match_type[0] === MatchType.LEAGUE
          ? [isNotNull(MatchTable.league_id)]
          : []),
        ...(match_type.length === 1 && match_type[0] === MatchType.FRIENDLY
          ? [isNull(MatchTable.league_id)]
          : []),
        ...(status.length > 0 ? [inArray(MatchTable.status, status)] : []),
      ),
      orderBy: desc(MatchTable.date),
    });

    const data = matches.map((match) => ({
      ...match,
      // Only a played match has an outcome: a scheduled or cancelled fixture
      // sits at 0-0 by definition and would otherwise read as a draw.
      result:
        match.status !== MatchStatus.COMPLETED
          ? null
          : match.home_team_score - match.away_team_score > 0
            ? MatchResult.WIN
            : match.home_team_score - match.away_team_score < 0
              ? MatchResult.LOSS
              : MatchResult.DRAW,
    }));

    // Every stat below is a record of matches actually played.
    const played = data.filter(
      ({ status }) => status === MatchStatus.COMPLETED,
    );

    const win_streak = played.reduce(
      (acc, match) => {
        if (match.result === MatchResult.WIN) {
          const current = acc.current + 1;
          return { current, max: Math.max(acc.max, current) };
        }
        return { ...acc, current: 0 };
      },
      { current: 0, max: 0 },
    ).max;

    const avg_win_rate =
      played.length > 0
        ? (played.filter((m) => m.result === MatchResult.WIN).length /
            played.length) *
          100
        : 0;
    const avg_points_per_game =
      played.length > 0
        ? played.reduce((acc, match) => acc + match.home_team_score, 0) /
          played.length
        : 0;

    return {
      stats: {
        total_matches: data.length,
        played_matches: played.length,
        win_streak,
        avg_win_rate:
          avg_win_rate > 0 ? parseFloat(avg_win_rate.toFixed(2)) : 0,
        avg_points_per_game:
          avg_points_per_game > 0
            ? parseFloat(avg_points_per_game.toFixed(2))
            : 0,
      },
      data,
    };
  } catch {
    return {
      stats: {
        total_matches: 0,
        played_matches: 0,
        win_streak: 0,
        avg_win_rate: 0,
        avg_points_per_game: 0,
      },
      data: [],
    };
  }
}

/**
 * @description How many matches a team appears in, on either side. Lets the
 * delete action explain the `restrict` on `match.home_team` / `away_team`
 * before Postgres raises it as a foreign key error.
 */
export async function countTeamMatches(team_id: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(MatchTable)
    .where(
      or(eq(MatchTable.home_team, team_id), eq(MatchTable.away_team, team_id)),
    );

  return row?.total ?? 0;
}

export async function insertMatch(match: InsertMatch) {
  return await db.insert(MatchTable).values(match);
}

export async function updateMatch(
  match_id: string,
  match: UpsertMatchSchemaValues,
) {
  return await db
    .update(MatchTable)
    .set(match)
    .where(eq(MatchTable.match_id, match_id));
}

export async function deleteMatch(match_id: string) {
  return await db.delete(MatchTable).where(eq(MatchTable.match_id, match_id));
}
