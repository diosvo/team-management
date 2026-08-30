'use server';

import { differenceInDays } from 'date-fns';
import { cache } from 'react';

import type { MatchesRateRecord } from '@/types/analytics';
import type { DateRange } from '@/types/common';
import { thisYear } from '@/utils/datetime';
import { MatchResult, MatchType } from '@/utils/enum';

import {
  getUpcomingMatches as fetchUpcomingMatches,
  getUpcomingSessions as fetchUpcomingSessions,
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from '@/db/analytics';
import { getMatches as fetchMatches } from '@/db/match';

import { getAchievements } from './achievement';
import { withAuth } from './auth';
import { getActivePlayers } from './user';

/**
 * @description Factory function that creates analytics actions with interval parameter
 */
function createAnalyticsAction<T>(
  fetcher: (team_id: string, range: DateRange) => Promise<T>,
) {
  return withAuth(async ({ team_id }, range: DateRange) =>
    fetcher(team_id, range),
  );
}

/**
 * Request-scoped wrapper so the overview stats and the matches-rate chart share
 * one query when they ask for the same window.
 *
 * The window is passed as two strings rather than a `DateRange`: `cache` keys on
 * argument identity, and a fresh object would miss on every call.
 */
const fetchGameMatches = cache(
  (team_id: string, from: string, to: string) =>
    fetchMatches({
      team_id,
      game_type: ['true'],
      from,
      to,
      match_type: [],
      // Unfiltered: `getMatches` already scopes the stats to played matches, and
      // the overview needs the scheduled ones for its next-game countdown.
      status: [],
      // TODO: it could be optional in the API, but the current implementation requires it
      page: 1,
      q: '',
    }),
);

export const getOverviewStats = withAuth(async ({ team_id }) => {
  // The headline win rate is always year-to-date, independent of the filter.
  const { from, to } = thisYear();

  const [active_players, upcoming_matches, matches, achievements] =
    await Promise.all([
      getActivePlayers(),
      getUpcomingMatches(),
      fetchGameMatches(team_id, from, to),
      getAchievements(),
    ]);

  const next_game =
    upcoming_matches.length > 0 ? upcoming_matches[0].date : null;
  const next_game_date = next_game
    ? differenceInDays(new Date(next_game), new Date())
    : null;

  return {
    active_players: active_players.length,
    next_game: next_game_date,
    win_rate: matches.stats.avg_win_rate,
    achievements: achievements.length,
  };
});

export const getMatchesRate = createAnalyticsAction(
  async (team_id, { from, to }: DateRange): Promise<Array<MatchesRateRecord>> => {
    const matchesData = await fetchGameMatches(team_id, from, to);

    return Object.entries(
      matchesData.data.reduce(
        (acc, match) => {
          const type = match.league_id ? MatchType.LEAGUE : MatchType.FRIENDLY;
          switch (match.result) {
            case MatchResult.WIN:
              acc.win[type] += 1;
              break;
            case MatchResult.DRAW:
              acc.draw[type] += 1;
              break;
            case MatchResult.LOSS:
              acc.lose[type] += 1;
              break;
            default:
              break;
          }
          return acc;
        },
        {
          win: { [MatchType.LEAGUE]: 0, [MatchType.FRIENDLY]: 0 },
          draw: { [MatchType.LEAGUE]: 0, [MatchType.FRIENDLY]: 0 },
          lose: { [MatchType.LEAGUE]: 0, [MatchType.FRIENDLY]: 0 },
        },
      ),
    ).map(([outcome, data]) => ({ outcome, ...data }));
  },
);

export const getUpcomingMatches = withAuth(async ({ team_id }) => {
  return await fetchUpcomingMatches(team_id);
});

export const getUpcomingSessions = withAuth(async ({ team_id }) => {
  return await fetchUpcomingSessions(team_id);
});

export const getAttendanceHistory = createAnalyticsAction(
  getTeamAttendanceHistory,
);

export const getAttendanceSummary = createAnalyticsAction(
  getPlayersAttendanceSummary,
);

export const getMostAbsenceReasons = createAnalyticsAction(
  getMostCommonAbsenceReasons,
);
