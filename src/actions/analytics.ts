'use server';

import { IntervalValues } from '@/types/common';

import {
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from '@/db/analytics';

import { withAuth } from './auth';

export const getAttendanceHistory = withAuth(
  async ({ team_id }, date: IntervalValues) =>
    await getTeamAttendanceHistory(team_id, date),
);

export const getAttendanceSummary = withAuth(
  async ({ team_id }, date: IntervalValues) =>
    await getPlayersAttendanceSummary(team_id, date),
);

export const getMostAbsenceReasons = withAuth(
  async ({ team_id }, date: IntervalValues) =>
    await getMostCommonAbsenceReasons(team_id, date),
);
