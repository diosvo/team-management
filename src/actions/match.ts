'use server';

import { forbidden } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { MatchStatus } from '@/utils/enum';
import { ResponseFactory } from '@/utils/response';

import type { MatchSearchParams } from '@/lib/nuqs';

import {
  deleteMatch,
  insertMatch,
  selectMatches,
  selectMatchOwnership,
  selectMatchPlayerStats,
  selectPlayedMatches,
  updateMatch,
  upsertMatchPlayerStats,
} from '@/db/match';
import { getDbErrorMessage } from '@/db/pg-error';
import { selectTeamPlayerIds } from '@/db/player';
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
    await selectMatches({ ...params, team_id }),
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
  async ({ team_id }) => await selectPlayedMatches(team_id),
);

export const getMatchPlayerStats = matches(
  ['view'],
  async ({ team_id }, match_id: string) => {
    // Only our own matches: the id comes from the URL.
    const match = await selectMatchOwnership(match_id);
    if (match?.home_team !== team_id) forbidden();
    return await selectMatchPlayerStats(match_id, team_id);
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

    const submitted = [
      ...new Set([
        ...rows.map(({ player_id }) => player_id),
        ...removed_player_ids,
      ]),
    ];
    // The match and every player must belong to the caller's team.
    const [match, allowedIds] = await Promise.all([
      selectMatchOwnership(match_id),
      selectTeamPlayerIds(team_id, submitted),
    ]);
    if (match?.home_team !== team_id) forbidden();

    // An unplayed or cancelled fixture has no box score to record.
    if (match.status !== MatchStatus.COMPLETED) {
      return ResponseFactory.error(t('boxScoreNotCompleted'));
    }

    const allowed = new Set(allowedIds);
    if (submitted.some((id) => !allowed.has(id))) forbidden();

    try {
      await upsertMatchPlayerStats(match_id, team_id, rows, removed_player_ids);

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
