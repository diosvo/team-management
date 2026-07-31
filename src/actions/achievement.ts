'use server';

import { isPast } from 'date-fns';

import { ResponseFactory } from '@/utils/response';

import {
  deleteAchievement,
  getAchievements as fetchAchievements,
  getPlayerLeagueStatSuggestions as fetchPlayerLeagueStatSuggestions,
  insertAchievement,
  updateAchievement,
} from '@/db/achievement';
import { getLeagueById } from '@/db/league';
import { getDbErrorMessage } from '@/db/pg-error';
import { UpsertAchievementSchemaValues } from '@/schemas/achievement';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const achievements = withResource('achievements');

export const getAchievements = withAuth(fetchAchievements);

export const getPlayerLeagueStatSuggestions = achievements(
  ['create', 'edit'],
  async (_, league_id: string) =>
    await fetchPlayerLeagueStatSuggestions(league_id),
);

export const upsertAchievement = achievements(
  ['create', 'edit'],
  async function upsert(
    _,
    achievement_id: string,
    achievement: UpsertAchievementSchemaValues,
  ) {
    // Derive the status from dates instead of trusting `league.status`,
    // which is only refreshed when the league itself is edited.
    if (achievement.league_id) {
      const league = await getLeagueById(achievement.league_id);

      if (!league) {
        return ResponseFactory.error('League not found');
      }
      if (!isPast(league.end_date)) {
        return ResponseFactory.error(
          'Achievements can only be recorded for ended leagues',
        );
      }
    }

    try {
      const isUpdate = !!achievement_id;

      if (isUpdate) {
        await updateAchievement(achievement_id, achievement);
      } else {
        await insertAchievement(achievement);
      }

      revalidate.achievements();

      return ResponseFactory.success(
        `${isUpdate ? 'Updated' : 'Recorded'} achievement successfully`,
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeAchievement = achievements(
  ['delete'],
  async function remove(_, achievement_id: string) {
    try {
      await deleteAchievement(achievement_id);

      revalidate.achievements();

      return ResponseFactory.success('Deleted achievement successfully');
    } catch {
      return ResponseFactory.error('Failed to delete achievement');
    }
  },
);
