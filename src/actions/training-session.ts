'use server';

import { getTranslations } from 'next-intl/server';
import { ResponseFactory } from '@/utils/response';

import type { TrainingSearchParams } from '@/lib/nuqs';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteSession,
  getSessions as fetchSessions,
  insertSession,
  updateSession,
} from '@/db/training-session';
import { getTeamHeadCoach } from '@/db/user';
import type { UpsertSessionSchemaValues } from '@/schemas/training';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const training = withResource('training');

export const getCoach = withAuth(
  async ({ team_id }) => await getTeamHeadCoach(team_id),
);

export const getSessions = withAuth(
  async ({ team_id }, filters: TrainingSearchParams) =>
    await fetchSessions(team_id, filters),
);

export const upsertSession = training(
  ['create', 'edit'],
  async function upsert(
    { team_id },
    session_id: string,
    values: UpsertSessionSchemaValues,
  ) {
    const t = await getTranslations('actions.training');
    try {
      const coach = await getTeamHeadCoach(team_id);

      if (!coach) {
        return ResponseFactory.error(t('noCoach'));
      }

      if (session_id) {
        await updateSession(session_id, values);
      } else {
        await insertSession({
          ...values,
          team_id,
          coach_id: coach ? coach.id : null,
        });
      }

      revalidate.sessions();

      return ResponseFactory.success(t(session_id ? 'updated' : 'created'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeSession = training(
  ['delete'],
  async function remove(_, session_id: string) {
    const t = await getTranslations('actions.training');
    try {
      await deleteSession(session_id);

      revalidate.sessions();

      return ResponseFactory.success(t('deleted'));
    } catch (error) {
      const shortId = session_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(`${message} (id: ${shortId})`);
    }
  },
);
