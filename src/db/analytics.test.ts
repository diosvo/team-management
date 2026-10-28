import { and, asc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { MatchTable, TrainingSessionTable } from '@/drizzle/schema';
import { AttendanceTable } from '@/drizzle/schema/attendance';

import { mockSelectFailure, mockSelectSuccess } from '@/test/db-operations';
import {
  MOCK_ABSENCE_REASONS,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_DATE_RANGE,
  MOCK_PLAYER_RECORDS_MANY_NEED_ATTENTION,
  MOCK_PLAYER_RECORDS_MANY_TOP,
  MOCK_PLAYER_RECORDS_NEED_ATTENTION,
  MOCK_PLAYER_RECORDS_TOP_PERFORMERS,
  MOCK_PLAYERS_ATTENDANCE_SUMMARY,
} from '@/test/mocks/analytics';
import { MOCK_TEAM } from '@/test/mocks/team';

import { MatchStatus, SessionStatus } from '@/utils/enum';

import {
  getMostCommonAbsenceReasons,
  getUpcomingMatches,
  getUpcomingSessions,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from './analytics';
import { fromNow } from './utils';

vi.mock('@/drizzle', () => ({
  default: {
    select: vi.fn(),
    query: {
      MatchTable: {
        findMany: vi.fn(),
      },
      TrainingSessionTable: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/drizzle/schema', () => ({
  MatchTable: {
    home_team: 'home_team',
    status: 'status',
    date: 'date',
    time: 'time',
  },
  TrainingSessionTable: {
    team_id: 'team_id',
    status: 'status',
    date: 'date',
    start_time: 'start_time',
  },
  UserTable: {
    id: 'id',
    name: 'name',
    email: 'email',
    team_id: 'team_id',
  },
}));

vi.mock('@/drizzle/schema/attendance', () => ({
  AttendanceTable: {
    date: 'date',
    status: 'status',
    reason: 'reason',
    player_id: 'player_id',
    updated_at: 'updated_at',
  },
}));

describe('getUpcomingMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads the next three scheduled matches from today on', async () => {
    const upcoming = [{ match_id: 'match-1' }];
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue(
      upcoming as never,
    );

    await expect(getUpcomingMatches(MOCK_TEAM.team_id)).resolves.toEqual(
      upcoming,
    );

    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // Cancelled and already-completed fixtures are not "upcoming".
        where: and(
          eq(MatchTable.home_team, MOCK_TEAM.team_id),
          eq(MatchTable.status, MatchStatus.SCHEDULED),
          fromNow(MatchTable.date),
        ),
        orderBy: [asc(MatchTable.date), asc(MatchTable.time)],
        limit: 3,
      }),
    );
  });

  test('returns an empty list when the query fails', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockRejectedValue(
      new Error('Query failed'),
    );

    await expect(getUpcomingMatches(MOCK_TEAM.team_id)).resolves.toEqual([]);
  });
});

describe('getUpcomingSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads the next three scheduled sessions from today on', async () => {
    const upcoming = [{ session_id: 'session-1' }];
    vi.mocked(db.query.TrainingSessionTable.findMany).mockResolvedValue(
      upcoming as never,
    );

    await expect(getUpcomingSessions(MOCK_TEAM.team_id)).resolves.toEqual(
      upcoming,
    );

    expect(db.query.TrainingSessionTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(TrainingSessionTable.team_id, MOCK_TEAM.team_id),
          eq(TrainingSessionTable.status, SessionStatus.SCHEDULED),
          fromNow(TrainingSessionTable.date),
        ),
        orderBy: [
          asc(TrainingSessionTable.date),
          asc(TrainingSessionTable.start_time),
        ],
        limit: 3,
      }),
    );
  });

  test('returns an empty list when the query fails', async () => {
    vi.mocked(db.query.TrainingSessionTable.findMany).mockRejectedValue(
      new Error('Query failed'),
    );

    await expect(getUpcomingSessions(MOCK_TEAM.team_id)).resolves.toEqual([]);
  });
});

describe('getTeamAttendanceHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns attendance history when database query succeeds', async () => {
    const {
      mockFrom,
      mockInnerJoin,
      mockWhereWithGroupBy,
      mockGroupBy,
      mockOrderBy,
    } = mockSelectSuccess(MOCK_ATTENDANCE_HISTORY);

    const result = await getTeamAttendanceHistory(
      MOCK_TEAM.team_id,
      MOCK_DATE_RANGE,
    );

    expect(result).toEqual(MOCK_ATTENDANCE_HISTORY);
    // Verify query construction
    expect(db.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(AttendanceTable);
    expect(mockInnerJoin).toHaveBeenCalled();
    expect(mockWhereWithGroupBy).toHaveBeenCalled();
    expect(mockGroupBy).toHaveBeenCalledWith(AttendanceTable.date);
    expect(mockOrderBy).toHaveBeenCalled();
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exceptions',
      mockError: 'Unknown error',
    },
  ])(
    'returns empty array when database query $description',
    async ({ mockError }) => {
      mockSelectFailure(mockError);

      const result = await getTeamAttendanceHistory(
        MOCK_TEAM.team_id,
        MOCK_DATE_RANGE,
      );

      expect(result).toEqual([]);
    },
  );
});

describe('getPlayersAttendanceSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns players attendance summary when database query succeeds', async () => {
    const {
      mockFrom,
      mockInnerJoin,
      mockWhereWithGroupBy,
      mockGroupBy,
      mockHaving: mockTopHaving,
    } = mockSelectSuccess(MOCK_PLAYERS_ATTENDANCE_SUMMARY.top_performers);
    const { mockHaving: mockNeedAttentionHaving } = mockSelectSuccess(
      MOCK_PLAYERS_ATTENDANCE_SUMMARY.need_attention,
    );

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      MOCK_DATE_RANGE,
    );

    expect(result).toEqual(MOCK_PLAYERS_ATTENDANCE_SUMMARY);
    // Verify query construction
    expect(db.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(AttendanceTable);
    expect(mockInnerJoin).toHaveBeenCalled();
    expect(mockWhereWithGroupBy).toHaveBeenCalled();
    expect(mockGroupBy).toHaveBeenCalled();

    // The `having` predicates passed to drizzle aren't invoked by the mock
    // chain, so call them directly to cover their bodies.
    const [topHaving] = mockTopHaving.mock.calls[0];
    expect(topHaving({ attendance_rate: 80 } as never)).toEqual({
      field: 80,
      value: 80,
      type: 'gte',
    });
    const [needAttentionHaving] = mockNeedAttentionHaving.mock.calls[0];
    expect(needAttentionHaving({ attendance_rate: 40 } as never)).toEqual({
      field: 40,
      value: 50,
      type: 'lt',
    });
  });

  test('filters top performers correctly (attendance_rate >= 80)', async () => {
    mockSelectSuccess(MOCK_PLAYER_RECORDS_TOP_PERFORMERS);
    mockSelectSuccess([]);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      MOCK_DATE_RANGE,
    );

    expect(result.top_performers).toHaveLength(2);
    expect(result.top_performers[0].attendance_rate).toBeGreaterThanOrEqual(80);
    expect(result.top_performers[1].attendance_rate).toBeGreaterThanOrEqual(80);
  });

  test('filters need attention correctly (attendance_rate < 50)', async () => {
    mockSelectSuccess([]);
    mockSelectSuccess(MOCK_PLAYER_RECORDS_NEED_ATTENTION);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      MOCK_DATE_RANGE,
    );

    expect(result.need_attention).toHaveLength(2);
    expect(result.need_attention[0].attendance_rate).toBeLessThan(50);
    expect(result.need_attention[1].attendance_rate).toBeLessThan(50);
  });

  test('limits top performers to 3 players', async () => {
    mockSelectSuccess(MOCK_PLAYER_RECORDS_MANY_TOP);
    mockSelectSuccess([]);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      MOCK_DATE_RANGE,
    );

    expect(result.top_performers.length).toBeLessThanOrEqual(3);
  });

  test('limits need attention to 3 players', async () => {
    mockSelectSuccess([]);
    mockSelectSuccess(MOCK_PLAYER_RECORDS_MANY_NEED_ATTENTION);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      MOCK_DATE_RANGE,
    );

    expect(result.need_attention.length).toBeLessThanOrEqual(3);
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exceptions',
      mockError: 'Unknown error',
    },
  ])(
    'returns default empty arrays when database query $description',
    async ({ mockError }) => {
      mockSelectFailure(mockError);

      const result = await getPlayersAttendanceSummary(
        MOCK_TEAM.team_id,
        MOCK_DATE_RANGE,
      );

      expect(result).toEqual({
        top_performers: [],
        need_attention: [],
      });
    },
  );
});

describe('getMostCommonAbsenceReasons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns absence reasons when database query succeeds', async () => {
    const {
      mockFrom,
      mockInnerJoin,
      mockWhereWithGroupBy,
      mockGroupBy,
      mockOrderBy,
      mockLimit,
    } = mockSelectSuccess(MOCK_ABSENCE_REASONS);

    const result = await getMostCommonAbsenceReasons(
      MOCK_TEAM.team_id,
      MOCK_DATE_RANGE,
    );

    expect(result).toEqual(MOCK_ABSENCE_REASONS);
    // Verify query construction
    expect(db.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(AttendanceTable);
    expect(mockInnerJoin).toHaveBeenCalled();
    expect(mockWhereWithGroupBy).toHaveBeenCalled();
    expect(mockGroupBy).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  test('limits results to 5 reasons', async () => {
    const { mockLimit } = mockSelectSuccess(MOCK_ABSENCE_REASONS);

    await getMostCommonAbsenceReasons(MOCK_TEAM.team_id, MOCK_DATE_RANGE);

    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exceptions',
      mockError: 'Unknown error',
    },
  ])(
    'returns empty array when database query $description',
    async ({ mockError }) => {
      mockSelectFailure(mockError);

      const result = await getMostCommonAbsenceReasons(
        MOCK_TEAM.team_id,
        MOCK_DATE_RANGE,
      );

      expect(result).toEqual([]);
    },
  );
});
