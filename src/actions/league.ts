'use server';

import { getTranslations } from 'next-intl/server';
import { ResponseFactory } from '@/utils/response';

import {
  addPlayerToLeagueRoster,
  deleteLeague,
  getLeagueById,
  getLeagues as fetchLeagues,
  getPlayersInLeague as fetchPlayersInLeague,
  insertLeague,
  registerTeamInLeague,
  removePlayerFromLeagueRoster,
  updateLeague,
} from '@/db/league';
import { getDbErrorMessage } from '@/db/pg-error';
import { getTeamPlayerIds } from '@/db/player';
import type { UpsertLeagueSchemaValues } from '@/schemas/league';
import { LeagueStatus } from '@/utils/enum';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const leagues = withResource('leagues');

/**
 * A league that has started is history: the UI shows it read-only, and the
 * server has to agree, otherwise a crafted request could rewrite results.
 */
async function assertUpcoming(league_id: string) {
  const league = await getLeagueById(league_id);

  return league?.status === LeagueStatus.UPCOMING;
}

export const getLeagues = withAuth(fetchLeagues);

export const getPlayersInLeague = withAuth(
  async (user, league_id: string) =>
    await fetchPlayersInLeague(user.team_id, league_id),
);

export const upsertLeague = leagues(
  ['create', 'edit'],
  async function upsert(
    user,
    league_id: string,
    league: UpsertLeagueSchemaValues,
    player_ids?: Array<string>,
  ) {
    const t = await getTranslations('actions.league');

    try {
      const isUpdate = !!league_id;
      let leagueId = league_id;

      if (isUpdate) {
        if (!(await assertUpcoming(league_id))) {
          return ResponseFactory.error(t('notUpcoming'));
        }
        await updateLeague(league_id, league);
      } else {
        const [result] = await insertLeague(league);
        leagueId = result.league_id;
      }

      // Roster rows point at a (league, team) pair in `league_team`, so the
      // team has to be entered into the league before any player is added.
      await registerTeamInLeague(leagueId, user.team_id);

      const rosterErrors = await syncLeagueRoster(
        user.team_id,
        leagueId,
        isUpdate,
        player_ids,
      );

      if (rosterErrors.length > 0) {
        return ResponseFactory.error(rosterErrors.join('\n'));
      }

      revalidate.leagues();

      return ResponseFactory.success(t(isUpdate ? 'updated' : 'added'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeLeague = leagues(
  ['delete'],
  async function remove(_, league_id: string) {
    const t = await getTranslations('actions.league');
    try {
      if (!(await assertUpcoming(league_id))) {
        return ResponseFactory.error(t('notUpcoming'));
      }

      await deleteLeague(league_id);

      revalidate.leagues();

      return ResponseFactory.success(t('deleted'));
    } catch {
      return ResponseFactory.error(t('deleteFailed'));
    }
  },
);

async function syncLeagueRoster(
  team_id: string,
  league_id: string,
  isUpdate: boolean,
  player_ids?: Array<string>,
): Promise<Array<string>> {
  if (!league_id || player_ids == null) return [];

  const t = await getTranslations('actions.league');

  // Get current players only for existing leagues
  const currentPlayers = isUpdate
    ? await fetchPlayersInLeague(team_id, league_id)
    : [];
  const currentPlayerIds = currentPlayers.map((p) => p.id);

  // Determine player changes
  const requestedToAdd = player_ids.filter(
    (id) => !currentPlayerIds.includes(id),
  );
  const toRemove = currentPlayerIds.filter((id) => !player_ids.includes(id));

  // A roster row names a team, but `player` carries no team of its own, so the
  // database cannot stop someone else's player being registered under ours.
  const eligible = new Set(await getTeamPlayerIds(team_id, requestedToAdd));
  const toAdd = requestedToAdd.filter((id) => eligible.has(id));
  const rejected = requestedToAdd
    .filter((id) => !eligible.has(id))
    .map((id) => t('playerNotOnTeam', { id: id.slice(0, 8) }));

  // Each add/remove targets a distinct row, so run the whole batch in
  // parallel and keep the per-player error messages via allSettled
  const tasks = [
    ...toAdd.map((player_id) => ({
      run: () => addPlayerToLeagueRoster(team_id, league_id, player_id),
      describe: (message: string) =>
        `${message} (id: ${player_id.slice(0, 8)})`,
    })),
    ...toRemove.map((player_id) => ({
      run: () => removePlayerFromLeagueRoster(team_id, league_id, player_id),
      describe: (message: string) =>
        t('removePlayerFailed', { id: player_id.slice(0, 8), message }),
    })),
  ];

  const settled = await Promise.allSettled(tasks.map((task) => task.run()));

  return [
    ...rejected,
    ...settled.flatMap((result, index) => {
      if (result.status === 'fulfilled') return [];

      const { message } = getDbErrorMessage(result.reason);
      return [tasks[index].describe(message)];
    }),
  ];
}
