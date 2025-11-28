'use server';

import { getDbErrorMessage } from '@/db/pg-error';
import { ResponseFactory } from '@/utils/response';

import { withAuth } from './auth';
import { revalidate } from './cache';

import {
  deleteMatch,
  getMatches as fetchMatches,
  insertMatch,
  updateMatch,
} from '@/db/match';
import { UpsertMatchSchemaValues } from '@/schemas/match';
import { MatchSearchParams } from '@/utils/filters';

export const getMatches = withAuth(
  async (_, params: MatchSearchParams) => await fetchMatches(params),
);

export const upsertMatch = withAuth(
  async (user, match_id: string, match: UpsertMatchSchemaValues) => {
    const extened = { ...match, home_team: user.team_id };

    try {
      if (match_id) {
        await updateMatch(match_id, match);
      } else {
        await insertMatch(extened);
      }

      revalidate.matches();

      return ResponseFactory.success(
        `${match_id ? 'Updated' : 'Added'} match successfully`,
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeMatch = withAuth(async (_, match_id: string) => {
  try {
    await deleteMatch(match_id);

    revalidate.matches();

    return ResponseFactory.success('Deleted match successfully');
  } catch {
    return ResponseFactory.error('Failed to delete match');
  }
});
