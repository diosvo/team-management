'use server';

import { getTranslations } from 'next-intl/server';
import { getDbErrorMessage } from '@/db/pg-error';
import { ResponseFactory } from '@/utils/response';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const matches = withResource('matches');

import {
  deleteMatch,
  getMatches as fetchMatches,
  insertMatch,
  updateMatch,
} from '@/db/match';
import type { MatchSearchParams } from '@/lib/nuqs';
import type { UpsertMatchSchemaValues } from '@/schemas/match';

export const getMatches = withAuth(
  async ({ team_id }, params: MatchSearchParams) =>
    await fetchMatches({ ...params, team_id }),
);

export const upsertMatch = matches(
  ['create', 'edit'],
  async function upsert(
    user,
    match_id: string,
    match: UpsertMatchSchemaValues,
  ) {
    const t = await getTranslations('actions.match');
    const extended = { ...match, home_team: user.team_id };

    try {
      if (match_id) {
        await updateMatch(match_id, match);
      } else {
        await insertMatch(extended);
      }

      revalidate.matches();

      return ResponseFactory.success(t(match_id ? 'updated' : 'added'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeMatch = matches(
  ['delete'],
  async function remove(_, match_id: string) {
    const t = await getTranslations('actions.match');
    try {
      await deleteMatch(match_id);

      revalidate.matches();

      return ResponseFactory.success(t('deleted'));
    } catch {
      return ResponseFactory.error(t('deleteFailed'));
    }
  },
);
