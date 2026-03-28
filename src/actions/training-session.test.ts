import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteSession,
  getSessions as getDbSessions,
  insertSession,
  updateSession,
} from '@/db/training-session';
import { getTeamHeadCoach } from '@/db/user';
import { UpsertSessionSchemaValues } from '@/schemas/training';

import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';
import {
  MOCK_TRAINING_SESSION,
  MOCK_TRAINING_SESSION_INPUT,
  MOCK_TRAINING_SESSION_RESPONSE,
} from '@/test/mocks/training-sessions';
import { MOCK_COACH_WITH_NAME } from '@/test/mocks/user';

import { Interval } from '@/utils/enum';
import { TrainingSearchParams } from '@/utils/filters';

import {
  getCoach,
  getSessions,
  removeSession,
  upsertSession,
} from './training-session';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/training-session', () => ({
  getSessions: vi.fn(),
  insertSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

vi.mock('@/db/user', () => ({
  getTeamHeadCoach: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    sessions: vi.fn(),
  },
}));

const MOCK_SESSION_ID = MOCK_TRAINING_SESSION.session_id;

describe('permissions', () => {
  test('scopes to the training resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('training');
  });

  test('upsertSession requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeSession requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('Training Session Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCoach', () => {
    test('returns head coach for the team', async () => {
      vi.mocked(getTeamHeadCoach).mockResolvedValue(MOCK_COACH_WITH_NAME);

      const result = await getCoach();

      expect(getTeamHeadCoach).toHaveBeenCalled();
      expect(result).toEqual(MOCK_COACH_WITH_NAME);
    });

    test('returns null when no coach is assigned', async () => {
      vi.mocked(getTeamHeadCoach).mockResolvedValue(null);

      const result = await getCoach();

      expect(result).toBeNull();
    });
  });

  describe('getSessions', () => {
    const mockParams: TrainingSearchParams = {
      interval: Interval.THIS_MONTH,
      status: 'all',
      page: 1,
      q: '',
    };

    test('calls getSessions with params', async () => {
      vi.mocked(getDbSessions).mockResolvedValue(
        MOCK_TRAINING_SESSION_RESPONSE,
      );

      const result = await getSessions(mockParams);

      expect(getDbSessions).toHaveBeenCalledWith(MOCK_TEAM.team_id, mockParams);
      expect(result).toEqual(MOCK_TRAINING_SESSION_RESPONSE);
    });

    test('returns empty response when no sessions exist', async () => {
      const emptyResponse = {
        data: [],
        stats: {
          completed_sessions: 0,
          avg_attendance: 0,
          total_hours: 0,
        },
      };
      vi.mocked(getDbSessions).mockResolvedValue(emptyResponse);

      const result = await getSessions(mockParams);

      expect(result).toEqual(emptyResponse);
    });

    test('propagates errors from getSessions', async () => {
      const message = 'Database error';
      vi.mocked(getDbSessions).mockRejectedValue(new Error(message));

      await expect(getSessions(mockParams)).rejects.toThrow(message);
    });
  });

  describe('upsertSession', () => {
    const sessionData: UpsertSessionSchemaValues = {
      date: MOCK_TRAINING_SESSION_INPUT.date,
      start_time: MOCK_TRAINING_SESSION_INPUT.start_time,
      end_time: MOCK_TRAINING_SESSION_INPUT.end_time,
      location_id: MOCK_TRAINING_SESSION_INPUT.location_id,
      status: MOCK_TRAINING_SESSION_INPUT.status!,
    };

    test('updates existing session and revalidates cache', async () => {
      vi.mocked(getTeamHeadCoach).mockResolvedValue(MOCK_COACH_WITH_NAME);
      vi.mocked(updateSession).mockResolvedValue([MOCK_TRAINING_SESSION]);

      const result = await upsertSession(MOCK_SESSION_ID, sessionData);

      expect(updateSession).toHaveBeenCalledWith(MOCK_SESSION_ID, sessionData);
      expect(insertSession).not.toHaveBeenCalled();
      expect(revalidate.sessions).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated training session successfully',
      });
    });

    test('inserts new session when session_id is empty', async () => {
      vi.mocked(getTeamHeadCoach).mockResolvedValue(MOCK_COACH_WITH_NAME);
      vi.mocked(insertSession).mockResolvedValue([MOCK_TRAINING_SESSION]);

      const result = await upsertSession('', sessionData);

      expect(insertSession).toHaveBeenCalledWith({
        ...sessionData,
        team_id: MOCK_TRAINING_SESSION_INPUT.team_id,
        coach_id: MOCK_COACH_WITH_NAME.id,
      });
      expect(updateSession).not.toHaveBeenCalled();
      expect(revalidate.sessions).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Created training session successfully',
      });
    });

    test('returns error when no coach is assigned to the team', async () => {
      vi.mocked(getTeamHeadCoach).mockResolvedValue(null);

      const result = await upsertSession(MOCK_SESSION_ID, sessionData);

      expect(insertSession).not.toHaveBeenCalled();
      expect(updateSession).not.toHaveBeenCalled();
      expect(revalidate.sessions).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'No coach assigned to the team',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(getTeamHeadCoach).mockResolvedValue(MOCK_COACH_WITH_NAME);
      vi.mocked(updateSession).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertSession(MOCK_SESSION_ID, sessionData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.sessions).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('returns error response when insert fails', async () => {
      const errorMessage = 'Insert failed';
      vi.mocked(getTeamHeadCoach).mockResolvedValue(MOCK_COACH_WITH_NAME);
      vi.mocked(insertSession).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertSession('', sessionData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.sessions).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Unique constraint violation';
      vi.mocked(getTeamHeadCoach).mockResolvedValue(MOCK_COACH_WITH_NAME);
      vi.mocked(updateSession).mockRejectedValue({
        code: '23505',
        detail: 'Duplicate key',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'unique_session_date',
      });

      const result = await upsertSession(MOCK_SESSION_ID, sessionData);

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });

  describe('removeSession', () => {
    test('deletes session successfully and revalidates cache', async () => {
      vi.mocked(deleteSession).mockResolvedValue([MOCK_TRAINING_SESSION]);

      const result = await removeSession(MOCK_SESSION_ID);

      expect(deleteSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
      expect(revalidate.sessions).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Training session deleted successfully',
      });
    });

    test('returns error response with short id when delete fails', async () => {
      const errorMessage = 'Delete failed';
      vi.mocked(deleteSession).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await removeSession(MOCK_SESSION_ID);

      expect(deleteSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
      expect(revalidate.sessions).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: `${errorMessage} (id: ${MOCK_SESSION_ID.slice(0, 8)})`,
      });
    });

    test('handles database constraint errors on delete', async () => {
      const pgError = 'Foreign key constraint violation';
      vi.mocked(deleteSession).mockRejectedValue({ code: '23503' });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'fk_session',
      });

      const result = await removeSession(MOCK_SESSION_ID);

      expect(result).toEqual({
        success: false,
        message: `${pgError} (id: ${MOCK_SESSION_ID.slice(0, 8)})`,
      });
    });
  });
});
