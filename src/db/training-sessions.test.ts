import { and, desc, eq, gte, lte } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertTrainingSession, TrainingSessionTable } from '@/drizzle/schema';

import { ALL } from '@/utils/constant';
import { Interval, SessionStatus } from '@/utils/enum';
import { TrainingSearchParams } from '@/utils/filters';
import { TIME_DURATION } from '@/utils/formatter';

import {
  mockDeleteReturningFailure,
  mockDeleteReturningSuccess,
  mockInsertReturningFailure,
  mockInsertReturningSuccess,
  mockUpdateReturningFailure,
  mockUpdateReturningSuccess,
} from '@/test/db-operations';
import { MOCK_TEAM } from '@/test/mocks/team';
import {
  MOCK_SESSIONS_DB_RESULT,
  MOCK_TRAINING_SESSION,
  MOCK_TRAINING_SESSION_INPUT,
  MOCK_TRAINING_SESSION_RESPONSE,
} from '@/test/mocks/training-sessions';

import {
  deleteSession,
  getSessions,
  insertSession,
  updateSession,
} from './training-session';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      TrainingSessionTable: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/drizzle/schema', () => ({
  TrainingSessionTable: {
    session_id: 'session_id',
    team_id: 'team_id',
    date: 'date',
    start_time: 'start_time',
    status: 'status',
  },
}));

describe('getSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams: TrainingSearchParams = {
    interval: Interval.THIS_MONTH,
    status: ALL.value,
    page: 1,
    q: '',
  };

  test('returns sessions with stats when database query succeeds', async () => {
    vi.mocked(db.query.TrainingSessionTable.findMany).mockResolvedValue(
      MOCK_SESSIONS_DB_RESULT,
    );

    const result = await getSessions(MOCK_TEAM.team_id, mockParams);

    const { start, end } = TIME_DURATION[mockParams.interval];

    expect(result).toEqual(MOCK_TRAINING_SESSION_RESPONSE);
    // Verify query construction
    expect(db.query.TrainingSessionTable.findMany).toHaveBeenCalledWith({
      where: and(
        eq(TrainingSessionTable.team_id, MOCK_TEAM.team_id),
        gte(TrainingSessionTable.date, start.toISOString()),
        lte(TrainingSessionTable.date, end.toISOString()),
      ),
      with: {
        location: { columns: { name: true } },
        coach: { columns: { id: true } },
        attendances: { columns: { attendance_id: true, status: true } },
      },
      orderBy: [
        desc(TrainingSessionTable.date),
        desc(TrainingSessionTable.start_time),
      ],
    });
  });

  test('applies status filter when status is not ALL', async () => {
    vi.mocked(db.query.TrainingSessionTable.findMany).mockResolvedValue(
      MOCK_SESSIONS_DB_RESULT,
    );

    const paramsWithStatus: TrainingSearchParams = {
      ...mockParams,
      status: SessionStatus.COMPLETED,
    };

    await getSessions(MOCK_TEAM.team_id, paramsWithStatus);

    const { start, end } = TIME_DURATION[paramsWithStatus.interval];

    expect(db.query.TrainingSessionTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(TrainingSessionTable.team_id, MOCK_TEAM.team_id),
          gte(TrainingSessionTable.date, start.toISOString()),
          lte(TrainingSessionTable.date, end.toISOString()),
          eq(TrainingSessionTable.status, SessionStatus.COMPLETED),
        ),
      }),
    );
  });

  test('returns empty stats when no sessions exist', async () => {
    vi.mocked(db.query.TrainingSessionTable.findMany).mockResolvedValue([]);

    const result = await getSessions(MOCK_TEAM.team_id, mockParams);

    expect(result).toEqual({
      data: [],
      stats: {
        completed_sessions: 0,
        avg_attendance: 0,
        total_hours: 0,
      },
    });
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exception',
      mockError: 'Unknown error',
    },
  ])(
    'returns default stats when database query $description',
    async ({ mockError }) => {
      vi.mocked(db.query.TrainingSessionTable.findMany).mockRejectedValue(
        mockError,
      );

      const result = await getSessions(MOCK_TEAM.team_id, mockParams);

      expect(result).toEqual({
        data: [],
        stats: {
          completed_sessions: 0,
          avg_attendance: 0,
          total_hours: 0,
        },
      });
    },
  );
});

describe('insertSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts session successfully', async () => {
    const { mockValues, mockReturning } = mockInsertReturningSuccess([
      MOCK_TRAINING_SESSION,
    ]);

    const result = await insertSession(MOCK_TRAINING_SESSION_INPUT);

    expect(result).toEqual([MOCK_TRAINING_SESSION]);
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(TrainingSessionTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_TRAINING_SESSION_INPUT);
    expect(mockReturning).toHaveBeenCalled();
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertReturningFailure(message);

    await expect(insertSession({} as InsertTrainingSession)).rejects.toThrow(
      message,
    );
  });
});

describe('updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates session successfully', async () => {
    const { mockSet, mockWhere, mockReturning } = mockUpdateReturningSuccess([
      MOCK_TRAINING_SESSION,
    ]);

    const result = await updateSession(
      MOCK_TRAINING_SESSION.session_id,
      MOCK_TRAINING_SESSION_INPUT,
    );

    expect(result).toEqual([MOCK_TRAINING_SESSION]);
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(TrainingSessionTable);
    expect(mockSet).toHaveBeenCalledWith(MOCK_TRAINING_SESSION_INPUT);
    expect(eq).toHaveBeenCalledWith(
      TrainingSessionTable.session_id,
      MOCK_TRAINING_SESSION.session_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: TrainingSessionTable.session_id,
      value: MOCK_TRAINING_SESSION.session_id,
      type: 'eq',
    });
    expect(mockReturning).toHaveBeenCalled();
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateReturningFailure(message);

    await expect(
      updateSession(
        MOCK_TRAINING_SESSION.session_id,
        MOCK_TRAINING_SESSION_INPUT,
      ),
    ).rejects.toThrow(message);
  });
});

describe('deleteSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes session successfully', async () => {
    const { mockWhere, mockReturning } = mockDeleteReturningSuccess([
      MOCK_TRAINING_SESSION,
    ]);

    const result = await deleteSession(MOCK_TRAINING_SESSION.session_id);

    expect(result).toEqual([MOCK_TRAINING_SESSION]);
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(TrainingSessionTable);
    expect(eq).toHaveBeenCalledWith(
      TrainingSessionTable.session_id,
      MOCK_TRAINING_SESSION.session_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: TrainingSessionTable.session_id,
      value: MOCK_TRAINING_SESSION.session_id,
      type: 'eq',
    });
    expect(mockReturning).toHaveBeenCalled();
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteReturningFailure(message);

    await expect(
      deleteSession(MOCK_TRAINING_SESSION.session_id),
    ).rejects.toThrow(message);
  });
});
