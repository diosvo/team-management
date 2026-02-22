'use server';

import { IntervalValues } from '@/types/common';

import {
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from '@/db/analytics';

import { withAuth } from './auth';

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

export const getAttendanceHistory = createAnalyticsAction(
  getTeamAttendanceHistory,
);

export const getAttendanceSummary = createAnalyticsAction(
  getPlayersAttendanceSummary,
);

export const getMostAbsenceReasons = createAnalyticsAction(
  getMostCommonAbsenceReasons,
);
