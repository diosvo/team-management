import { and, desc, eq, gte, isNotNull, isNull, lte } from 'drizzle-orm';

import { DataWithStats } from '@/types/common';
import { MatchStats, MatchWithTeams } from '@/types/match';

import { MatchSearchParams } from '@/lib/nuqs';
import { MatchStatus, MatchType } from '@/utils/enum';
import { TIME_DURATION } from '@/utils/formatter';

import db from '@/drizzle';
import { InsertMatch, MatchTable } from '@/drizzle/schema';
import { UpsertMatchSchemaValues } from '@/schemas/match';

export async function getMatches(
  params: MatchSearchParams & { team_id: string },
): Promise<DataWithStats<MatchWithTeams, MatchStats>> {
  const { game_type, interval, match_type, team_id } = params;
  const { start, end } = TIME_DURATION[interval];

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
        gte(MatchTable.date, start.toISOString()),
        lte(MatchTable.date, end.toISOString()),
        ...(match_type.length === 1 && match_type[0] === MatchType.LEAGUE
          ? [isNotNull(MatchTable.league_id)]
          : []),
        ...(match_type.length === 1 && match_type[0] === MatchType.FRIENDLY
          ? [isNull(MatchTable.league_id)]
          : []),
      ),
      orderBy: desc(MatchTable.date),
    });

    const data = matches.map((match) => ({
      ...match,
      result:
        match.home_team_score - match.away_team_score > 0
          ? MatchStatus.WIN
          : match.home_team_score - match.away_team_score < 0
            ? MatchStatus.LOSS
            : MatchStatus.DRAW,
    }));

    const win_streak = data.reduce(
      (acc, match) => {
        if (match.result === MatchStatus.WIN) {
          const current = acc.current + 1;
          return { current, max: Math.max(acc.max, current) };
        }
        return { ...acc, current: 0 };
      },
      { current: 0, max: 0 },
    ).max;

    const avg_win_rate =
      data.length > 0
        ? (data.filter((m) => m.result === MatchStatus.WIN).length /
            data.length) *
          100
        : 0;
    const avg_points_per_game =
      data.reduce((acc, match) => acc + match.home_team_score, 0) / data.length;

    return {
      stats: {
        total_matches: data.length,
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
        win_streak: 0,
        avg_win_rate: 0,
        avg_points_per_game: 0,
      },
      data: [],
    };
  }
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
