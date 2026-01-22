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
  updateLeague,
} from '@/db/league';
import { getDbErrorMessage } from '@/db/pg-error';
import { UpsertLeagueSchemaValues } from '@/schemas/league';

import { withAuth } from './auth';
import { revalidate } from './cache';

export const getLeagues = withAuth(fetchLeagues);

export const getPlayersInLeague = withAuth(async (user, league_id: string) =>
  fetchPlayersInLeague(user.team_id, league_id),
);

export const upsertLeague = withAuth(
  async (user, league_id: string, league: UpsertLeagueSchemaValues) => {
    const status = isFuture(league.start_date)
      ? LeagueStatus.UPCOMING
      : isPast(league.end_date)
        ? LeagueStatus.ENDED
        : LeagueStatus.ONGOING;
    const computed = { ...league, team_id: user.team_id, status };

    try {
      if (league_id) {
        await updateLeague(league_id, computed);
      } else {
        await insertLeague(computed);
      }

      revalidate.leagues();

      return ResponseFactory.success(
        `${league_id ? 'Updated' : 'Added'} league successfully`,
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeLeague = withAuth(async (_, league_id: string) => {
  try {
    await deleteLeague(league_id);

    revalidate.leagues();

    return ResponseFactory.success('Deleted league successfully');
  } catch {
    return ResponseFactory.error('Failed to delete asset');
  }
});

// TODO:
// - If players added to LeagueRosterTable, remove them if selection does not include them anymore. Otherwise, add them.
// - Only work when league is Update action > If it's a new league, add this after upsertLeague
export const upsertPlayerToLeague = withAuth(
  async (user, league_id: string, player_id: string) => {
    try {
      await addPlayerToLeagueRoster(user.team_id, league_id, player_id);

      return ResponseFactory.success('Added player to league roster');
    } catch (error) {
      const shortId = player_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(`${message} (id: ${shortId})`);
    }
  },
);
