'use server';

import { formatDistanceToNow } from 'date-fns';

import { MatchesRateRecord } from '@/types/analytics';
import { IntervalValues } from '@/types/common';
import { Interval, MatchStatus } from '@/utils/enum';

import {
  getUpcomingMatches as fetchUpcomingMatches,
  getUpcomingSessions as fetchUpcomingSessions,
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from '@/db/analytics';

import { withAuth } from './auth';
import { getMatches } from './match';
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

export const getOverviewStats = withAuth(async () => {
  const active_players = await getActivePlayers();
  const upcoming_matches = await getUpcomingMatches();
  const next_game =
    upcoming_matches.length > 0
      ? formatDistanceToNow(upcoming_matches[0].date, {
          addSuffix: true,
        })
      : null;
  const matches = await getMatches({
    is5x5: true,
    interval: Interval.THIS_YEAR,
    page: 1,
    q: '',
  });
  const win_rate = matches.stats.avg_win_rate;

  return {
    active_players: active_players.length,
    next_game,
    win_rate,
  };
});

export const getMatchesRate = withAuth(
  async (_, interval: IntervalValues): Promise<Array<MatchesRateRecord>> => {
    const matchesData = await getMatches({
      is5x5: true,
      interval,
      // TODO: it could be optional in the API, but the current implementation requires it
      page: 1,
      q: '',
    });

    return Object.entries(
      matchesData.data.reduce(
        (acc, match) => {
          const type = match.league_id ? 'league' : 'friendly';
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
          win: { league: 0, friendly: 0 },
          draw: { league: 0, friendly: 0 },
          lose: { league: 0, friendly: 0 },
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
