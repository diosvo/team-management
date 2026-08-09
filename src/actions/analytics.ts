'use server';

import { differenceInDays } from 'date-fns';
import { cache } from 'react';

import type { MatchesRateRecord } from '@/types/analytics';
import type { IntervalValues } from '@/types/common';
import { Interval, MatchStatus, MatchType } from '@/utils/enum';

import {
  getUpcomingMatches as fetchUpcomingMatches,
  getUpcomingSessions as fetchUpcomingSessions,
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from '@/db/analytics';
import { getMatches as fetchMatches } from '@/db/match';

import { withAuth } from './auth';
import { getActivePlayers } from './user';

/**
 * @description Factory function that creates analytics actions with interval parameter
 */
function createAnalyticsAction<T>(
  fetcher: (team_id: string, interval: IntervalValues) => Promise<T>,
) {
  return withAuth(async ({ team_id }, interval: IntervalValues) =>
    fetcher(team_id, interval),
  );
}

/**
 * Request-scoped, primitive-keyed wrapper so the overview stats and the
 * matches-rate chart share one query when they ask for the same interval.
 */
const fetchGameMatches = cache((team_id: string, interval: IntervalValues) =>
  fetchMatches({
    team_id,
    game_type: ['true'],
    interval,
    match_type: [],
    // TODO: it could be optional in the API, but the current implementation requires it
    page: 1,
    q: '',
  }),
);

export const getOverviewStats = withAuth(async ({ team_id }) => {
  const [active_players, upcoming_matches, matches] = await Promise.all([
    getActivePlayers(),
    getUpcomingMatches(),
    fetchGameMatches(team_id, Interval.THIS_YEAR),
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
  };
});

export const getMatchesRate = createAnalyticsAction(
  async (
    team_id,
    interval: IntervalValues,
  ): Promise<Array<MatchesRateRecord>> => {
    const matchesData = await fetchGameMatches(team_id, interval);

    return Object.entries(
      matchesData.data.reduce(
        (acc, match) => {
          const type = match.league_id ? MatchType.LEAGUE : MatchType.FRIENDLY;
          switch (match.result) {
            case MatchStatus.WIN:
              acc.win[type] += 1;
              break;
            case MatchStatus.DRAW:
              acc.draw[type] += 1;
              break;
            case MatchStatus.LOSS:
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
