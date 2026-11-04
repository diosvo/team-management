'use server';

import { pick } from 'es-toolkit';
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
  getPlayerHonorSummary as fetchHonorSummary,
  getPlayerMatchesOverview as fetchMatches,
  getPlayerTestingOverview as fetchTesting,
  getPlayerTestingSummary as fetchTestingSummary,
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

/** Wraps a db read so it runs on the resolved target and their team. */
function forTarget<T extends Array<unknown>, R>(
  read: (player_id: string, team_id: string, ...args: T) => Promise<R>,
) {
  return performance(['view'], async (user, target_id: string, ...args: T) => {
    const { id, team_id } = await resolveTarget(user, target_id);
    return await read(id, team_id, ...args);
  });
}

/** The stat row: attendance shares its cached read with the default tab. */
export const getPerformanceSummary = forTarget(
  async (id, team_id, range: DateRange): Promise<PerformanceSummary> => {
    const [attendance, testing, honors] = await Promise.all([
      fetchAttendance(id, team_id, range),
      fetchTestingSummary(id),
      fetchHonorSummary(id),
    ]);

    return {
      attendance: pick(attendance, [
        'rate',
        'total',
        'on_time',
        'late',
        'current_streak',
        'best_streak',
      ]),
      ...testing,
      honors,
    };
  },
);

export const getPlayerAttendance = forTarget(fetchAttendance);
export const getPlayerTesting = forTarget(fetchTesting);
export const getPlayerActivity = forTarget(fetchActivity);
export const getPlayerMatches = forTarget(fetchMatches);
