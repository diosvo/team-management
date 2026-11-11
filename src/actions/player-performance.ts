'use server';

import { cache } from 'react';
import { forbidden, notFound } from 'next/navigation';
import { pick } from 'es-toolkit';

import { UserRole } from '@/utils/enum';
import { hasPermissions } from '@/utils/permissions';

import {
  selectPlayerActivity,
  selectPlayerAttendanceOverview,
  selectPlayerHonorSummary,
  selectPlayerMatchesOverview,
  selectPlayerTestingOverview,
  selectPlayerTestingSummary,
} from '@/db/player-performance';
import { selectUserById } from '@/db/user';
import type { User } from '@/drizzle/schema/user';
import type { DateRange } from '@/types/common';
import type {
  PerformanceIdentity,
  PerformanceSummary,
} from '@/types/performance';

import { withResource } from './auth';

const performance = withResource('performance');

// Request-scoped: the stat row and every tab resolve the same target.
const fetchTarget = cache(selectUserById);

/**
 * Who the page is about. URL ids are checked against the session: players can
 * only view themselves; SUPER_ADMIN can view any member.
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
      selectPlayerAttendanceOverview(id, team_id, range),
      selectPlayerTestingSummary(id),
      selectPlayerHonorSummary(id),
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

export const getPlayerAttendance = forTarget(selectPlayerAttendanceOverview);
export const getPlayerTesting = forTarget(selectPlayerTestingOverview);
export const getPlayerActivity = forTarget(selectPlayerActivity);
export const getPlayerMatches = forTarget(selectPlayerMatchesOverview);
