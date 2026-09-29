'use server';

import { forbidden, notFound } from 'next/navigation';
import { cache } from 'react';

import type { DateRange } from '@/types/common';
import type {
  PerformanceIdentity,
  PerformanceSummary,
} from '@/types/performance';
import { UserRole } from '@/utils/enum';
import { hasPermissions } from '@/utils/permissions';

import {
  getPlayerActivity as fetchActivity,
  getPlayerAttendanceOverview as fetchAttendance,
  getPlayerHonors as fetchHonors,
  getPlayerMatchesOverview as fetchMatches,
  getPlayerTestingOverview as fetchTesting,
} from '@/db/player-performance';
import { getUserById } from '@/db/user';
import type { User } from '@/drizzle/schema/user';

import { withResource } from './auth';

const performance = withResource('performance');

// Request-scoped: the stat row and every tab resolve the same target.
const fetchTarget = cache(getUserById);

/**
 * Who the page is about. The id comes from the URL, so it is checked against
 * the session first: players may only open themselves, SUPER_ADMIN may open
 * any member (from the Roster actions).
 */
async function resolveTarget(user: User, target_id: string) {
  const { isAdmin } = hasPermissions(user.role);
  if (!isAdmin && user.id !== target_id) forbidden();

  const target = await fetchTarget(target_id);
  if (!target) notFound();

  return target;
}

export const getPerformanceIdentity = performance(
  ['view'],
  async (user, target_id: string): Promise<PerformanceIdentity> => {
    const target = await resolveTarget(user, target_id);

    return {
      id: target.id,
      name: target.name,
      is_own: target.id === user.id,
      is_player: target.role === UserRole.PLAYER,
      is_captain: target.player?.is_captain ?? false,
      jersey_number: target.player?.jersey_number ?? null,
      position: target.player?.position ?? null,
    };
  },
);

export const getPerformanceSummary = performance(
  ['view'],
  async (
    user,
    target_id: string,
    range: DateRange,
  ): Promise<PerformanceSummary> => {
    const { id, team_id } = await resolveTarget(user, target_id);

    const [attendance, testing, honors] = await Promise.all([
      fetchAttendance(id, team_id, range),
      fetchTesting(id, team_id),
      fetchHonors(id),
    ]);

    const { rate, total, on_time, late, current_streak, best_streak } =
      attendance;

    return {
      attendance: { rate, total, on_time, late, current_streak, best_streak },
      tests_taken: testing.tests_taken,
      last_tested: testing.last_tested,
      honors,
    };
  },
);

export const getPlayerAttendance = performance(
  ['view'],
  async (user, target_id: string, range: DateRange) => {
    const { id, team_id } = await resolveTarget(user, target_id);
    return await fetchAttendance(id, team_id, range);
  },
);

export const getPlayerTesting = performance(
  ['view'],
  async (user, target_id: string) => {
    const { id, team_id } = await resolveTarget(user, target_id);
    return await fetchTesting(id, team_id);
  },
);

export const getPlayerActivity = performance(
  ['view'],
  async (user, target_id: string, range: DateRange) => {
    const { id, team_id } = await resolveTarget(user, target_id);
    return await fetchActivity(id, team_id, range);
  },
);

export const getPlayerMatches = performance(
  ['view'],
  async (user, target_id: string, range: DateRange) => {
    const { id, team_id } = await resolveTarget(user, target_id);
    return await fetchMatches(id, team_id, range);
  },
);
