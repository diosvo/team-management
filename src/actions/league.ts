'use server';

import { isFuture, isPast } from 'date-fns';

import { LeagueStatus } from '@/utils/enum';
import { ResponseFactory } from '@/utils/response';

import {
  addPlayerToLeagueRoster,
  deleteLeague,
  getLeagues as fetchLeagues,
  getPlayersInLeague as fetchPlayersInLeague,
  insertLeague,
  removePlayerFromLeagueRoster,
  updateLeague,
} from '@/db/league';
import { getDbErrorMessage } from '@/db/pg-error';
import { UpsertLeagueSchemaValues } from '@/schemas/league';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const leagues = withResource('leagues');

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
    player_ids: Array<string> = [],
  ) {
    const status = isFuture(league.start_date)
      ? LeagueStatus.UPCOMING
      : isPast(league.end_date)
        ? LeagueStatus.ENDED
        : LeagueStatus.ONGOING;
    const computed = { ...league, team_id: user.team_id, status };

    try {
      const isUpdate = !!league_id;
      let leagueId = league_id;

      if (isUpdate) {
        await updateLeague(league_id, computed);
      } else {
        const [result] = await insertLeague(computed);
        leagueId = result.league_id;
      }

      const rosterErrors = await syncLeagueRoster(
        user.team_id,
        leagueId,
        player_ids,
        isUpdate,
      );

      if (rosterErrors.length > 0) {
        return ResponseFactory.error(rosterErrors.join('\n'));
      }

      revalidate.leagues();

      return ResponseFactory.success(
        `${isUpdate ? 'Updated' : 'Added'} league successfully`,
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeLeague = leagues(
  ['delete'],
  async function remove(_, league_id: string) {
    try {
      await deleteLeague(league_id);

      revalidate.leagues();

      return ResponseFactory.success('Deleted league successfully');
    } catch {
      return ResponseFactory.error('Failed to delete asset');
    }
  },
);

async function syncLeagueRoster(
  team_id: string,
  league_id: string,
  player_ids: Array<string>,
  isUpdate: boolean,
): Promise<Array<string>> {
  if (!league_id || player_ids.length === 0) return [];

  // Get current players only for existing leagues
  const currentPlayers = isUpdate
    ? await fetchPlayersInLeague(team_id, league_id)
    : [];
  const currentPlayerIds = currentPlayers.map((p) => p.id);

  // Determine player changes
  const toAdd = player_ids.filter((id) => !currentPlayerIds.includes(id));
  const toRemove = currentPlayerIds.filter((id) => !player_ids.includes(id));

  const errors: Array<string> = [];

  for (const player_id of toAdd) {
    try {
      await addPlayerToLeagueRoster(team_id, league_id, player_id);
    } catch (error) {
      const shortId = player_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      errors.push(`${message} (id: ${shortId})`);
    }
  }

  for (const player_id of toRemove) {
    try {
      await removePlayerFromLeagueRoster(team_id, league_id, player_id);
    } catch (error) {
      const shortId = player_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      errors.push(`Failed to remove player (id: ${shortId}) - ${message}`);
    }
  }

  return errors;
}
