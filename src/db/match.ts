import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { DataWithStats } from '@/types/common';
import { MatchStats, MatchWithTeams } from '@/types/match';

import { MatchStatus } from '@/utils/enum';
import { MatchSearchParams } from '@/utils/filters';
import { TIME_DURATION } from '@/utils/formatter';

import db from '@/drizzle';
import { InsertMatch, MatchTable } from '@/drizzle/schema';
import { UpsertMatchSchemaValues } from '@/schemas/match';

export async function getMatches(
  params: MatchSearchParams,
): Promise<DataWithStats<MatchWithTeams, MatchStats>> {
  const { is5x5, interval } = params;
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
        eq(MatchTable.is_5x5, is5x5),
        gte(MatchTable.date, start.toISOString()),
        lte(MatchTable.date, end.toISOString()),
      ),
      orderBy: desc(MatchTable.updated_at),
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

    const win_streak = data.reduce((streak, match) => {
      if (match.result === MatchStatus.WIN) {
        return streak + 1;
      }
      return streak;
    }, 0);

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

export async function getMatch(match_id: string) {
  try {
    return await db.query.MatchTable.findFirst({
      where: eq(MatchTable.match_id, match_id),
      with: {
        home_team: { columns: { name: true } },
        away_team: { columns: { name: true } },
        league: { columns: { name: true } },
        location: { columns: { name: true, address: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function insertMatch(match: InsertMatch) {
  try {
    return await db.insert(MatchTable).values(match).returning({
      match_id: MatchTable.match_id,
    });
  } catch (error) {
    throw error;
  }
}

export async function updateMatch(
  match_id: string,
  match: UpsertMatchSchemaValues,
) {
  try {
    return await db
      .update(MatchTable)
      .set(match)
      .where(eq(MatchTable.match_id, match_id));
  } catch (error) {
    throw error;
  }
}

export async function deleteMatch(match_id: string) {
  try {
    return await db.delete(MatchTable).where(eq(MatchTable.match_id, match_id));
  } catch {
    return null;
  }
}
