'use server';

import { forbidden } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getDbErrorMessage } from '@/db/pg-error';
import { MatchStatus } from '@/utils/enum';
import { ResponseFactory } from '@/utils/response';

import {
  deleteMatch,
  getMatches as fetchMatches,
  getMatchPlayerStats as fetchMatchPlayerStats,
  getMatchOwnership,
  getPlayedMatches as fetchPlayedMatches,
  insertMatch,
  saveMatchPlayerStats as persistMatchPlayerStats,
  updateMatch,
} from '@/db/match';
import { getTeamPlayerIds } from '@/db/player';
import type { MatchSearchParams } from '@/lib/nuqs';
import {
  SaveMatchPlayerStatsSchema,
  type SaveMatchPlayerStatsValues,
  type UpsertMatchSchemaValues,
} from '@/schemas/match';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const matches = withResource('matches');

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

//#region Player stats (box score)

export const canEditMatchStats = matches(['edit'], async () => true);

export const getPlayedMatches = matches(
  ['view'],
  async ({ team_id }) => await fetchPlayedMatches(team_id),
);

export const getMatchPlayerStats = matches(
  ['view'],
  async ({ team_id }, match_id: string) => {
    // Only our own matches: the id comes from the URL.
    const match = await getMatchOwnership(match_id);
    if (match?.home_team !== team_id) forbidden();
    return await fetchMatchPlayerStats(match_id, team_id);
  },
);

export const saveMatchPlayerStats = matches(
  ['edit'],
  async function save({ team_id }, values: SaveMatchPlayerStatsValues) {
    const t = await getTranslations('actions.match');
    const parsed = SaveMatchPlayerStatsSchema.safeParse(values);
    if (!parsed.success) {
      return ResponseFactory.error(t('boxScoreInvalid'));
    }

    const { match_id, rows, removed_player_ids } = parsed.data;

    // The match and every player must belong to the caller's team.
    const match = await getMatchOwnership(match_id);
    if (match?.home_team !== team_id) forbidden();

    // An unplayed or cancelled fixture has no box score to record.
    if (match.status !== MatchStatus.COMPLETED) {
      return ResponseFactory.error(t('boxScoreNotCompleted'));
    }

    const submitted = [
      ...new Set([
        ...rows.map(({ player_id }) => player_id),
        ...removed_player_ids,
      ]),
    ];
    const allowed = new Set(await getTeamPlayerIds(team_id, submitted));
    if (submitted.some((id) => !allowed.has(id))) forbidden();

    try {
      await persistMatchPlayerStats(
        match_id,
        team_id,
        rows,
        removed_player_ids,
      );

      revalidate.matchStats();

      return ResponseFactory.success(
        t('boxScoreSaved', { count: rows.length }),
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

//#endregion
