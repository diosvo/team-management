'use server';

import { SessionStatus } from '@/utils/enum';
import { TrainingSearchParams } from '@/utils/filters';
import { ResponseFactory } from '@/utils/response';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  getTrainingSessions as fetchSessions,
  insertTrainingSession,
  updateTrainingSession as modifySession,
  deleteTrainingSession as removeSession,
} from '@/db/training-session';
import { getTeamHeadCoach } from '@/db/user';
import { UpsertSessionSchemaValues } from '@/schemas/training';

import { withAuth } from './auth';
import { revalidate } from './cache';

export const getTrainingSessions = withAuth(
  async ({ team_id }, filters: TrainingSearchParams) =>
    await fetchSessions(team_id, filters),
);

export const createTrainingSession = withAuth(
  async ({ team_id }, values: UpsertSessionSchemaValues) => {
    try {
      const coach = await getTeamHeadCoach(team_id);

      await insertTrainingSession({
        ...values,
        team_id,
        coach_id: coach ? coach.id : null,
      });

      revalidate.sessions();

      return ResponseFactory.success('Training session created successfully');
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const updateTrainingSession = withAuth(
  async (_, session_id: string, values: UpsertSessionSchemaValues) => {
    try {
      await modifySession(session_id, values);

      revalidate.sessions();

      return ResponseFactory.success('Training session updated successfully');
    } catch (error) {
      const shortId = session_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(`${message} (id: ${shortId})`);
    }
  },
);

export const deleteTrainingSession = withAuth(async (_, session_id: string) => {
  try {
    await removeSession(session_id);

    revalidate.sessions();

    return ResponseFactory.success('Training session deleted successfully');
  } catch (error) {
    const shortId = session_id.slice(0, 8);
    const { message } = getDbErrorMessage(error);
    return ResponseFactory.error(`${message} (id: ${shortId})`);
  }
});

export const cancelTrainingSession = withAuth(async (_, session_id: string) => {
  try {
    await modifySession(session_id, { status: SessionStatus.CANCELLED });

    revalidate.sessions();

    return ResponseFactory.success('Training session cancelled successfully');
  } catch (error) {
    const shortId = session_id.slice(0, 8);
    const { message } = getDbErrorMessage(error);
    return ResponseFactory.error(`${message} (id: ${shortId})`);
  }
});
