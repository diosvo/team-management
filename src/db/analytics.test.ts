import db from '@/drizzle';
import { AttendanceTable } from '@/drizzle/schema/attendance';

import { Interval } from '@/utils/enum';

import { mockSelectFailure, mockSelectSuccess } from '@/test/db-operations';
import {
  MOCK_ABSENCE_REASONS,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_PLAYER_RECORDS_FULL,
  MOCK_PLAYER_RECORDS_MANY_NEED_ATTENTION,
  MOCK_PLAYER_RECORDS_MANY_TOP,
  MOCK_PLAYER_RECORDS_NEED_ATTENTION,
  MOCK_PLAYER_RECORDS_TOP_PERFORMERS,
  MOCK_PLAYERS_ATTENDANCE_SUMMARY,
} from '@/test/mocks/analytics';
import { MOCK_TEAM } from '@/test/mocks/team';

import {
  getMostCommonAbsenceReasons,
  getPlayersAttendanceSummary,
  getTeamAttendanceHistory,
} from './analytics';

vi.mock('@/drizzle', () => ({
  default: {
    select: vi.fn(),
  },
}));

vi.mock('@/drizzle/schema', () => ({
  UserTable: {
    id: 'id',
    name: 'name',
    email: 'email',
  },
}));

vi.mock('@/drizzle/schema/attendance', () => ({
  AttendanceTable: {
    team_id: 'team_id',
    date: 'date',
    status: 'status',
    reason: 'reason',
    player_id: 'player_id',
    updated_at: 'updated_at',
  },
}));

describe('getTeamAttendanceHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns attendance history when database query succeeds', async () => {
    const { mockFrom, mockWhere, mockGroupBy, mockOrderBy } = mockSelectSuccess(
      MOCK_ATTENDANCE_HISTORY,
    );

    const result = await getTeamAttendanceHistory(
      MOCK_TEAM.team_id,
      Interval.THIS_MONTH,
    );

    expect(result).toEqual(MOCK_ATTENDANCE_HISTORY);
    // Verify query construction
    expect(db.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(AttendanceTable);
    expect(mockWhere).toHaveBeenCalled();
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
        Interval.THIS_MONTH,
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
    const { mockFrom, mockLeftJoin, mockWhereWithGroupBy, mockGroupBy } =
      mockSelectSuccess(MOCK_PLAYER_RECORDS_FULL);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      Interval.THIS_MONTH,
    );

    expect(result).toEqual(MOCK_PLAYERS_ATTENDANCE_SUMMARY);
    // Verify query construction
    expect(db.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(AttendanceTable);
    expect(mockLeftJoin).toHaveBeenCalled();
    expect(mockWhereWithGroupBy).toHaveBeenCalled();
    expect(mockGroupBy).toHaveBeenCalled();
  });

  test('filters top performers correctly (attendance_rate >= 80)', async () => {
    mockSelectSuccess(MOCK_PLAYER_RECORDS_TOP_PERFORMERS);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      Interval.THIS_MONTH,
    );

    expect(result.top_performers).toHaveLength(2);
    expect(result.top_performers[0].attendance_rate).toBeGreaterThanOrEqual(80);
    expect(result.top_performers[1].attendance_rate).toBeGreaterThanOrEqual(80);
  });

  test('filters need attention correctly (attendance_rate < 50)', async () => {
    mockSelectSuccess(MOCK_PLAYER_RECORDS_NEED_ATTENTION);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      Interval.THIS_MONTH,
    );

    expect(result.need_attention).toHaveLength(2);
    expect(result.need_attention[0].attendance_rate).toBeLessThan(50);
    expect(result.need_attention[1].attendance_rate).toBeLessThan(50);
  });

  test('limits top performers to 3 players', async () => {
    mockSelectSuccess(MOCK_PLAYER_RECORDS_MANY_TOP);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      Interval.THIS_MONTH,
    );

    expect(result.top_performers.length).toBeLessThanOrEqual(3);
  });

  test('limits need attention to 3 players', async () => {
    mockSelectSuccess(MOCK_PLAYER_RECORDS_MANY_NEED_ATTENTION);

    const result = await getPlayersAttendanceSummary(
      MOCK_TEAM.team_id,
      Interval.THIS_MONTH,
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
        Interval.THIS_MONTH,
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
    const { mockFrom, mockWhere, mockGroupBy, mockOrderBy, mockLimit } =
      mockSelectSuccess(MOCK_ABSENCE_REASONS);

    const result = await getMostCommonAbsenceReasons(
      MOCK_TEAM.team_id,
      Interval.THIS_MONTH,
    );

    expect(result).toEqual(MOCK_ABSENCE_REASONS);
    // Verify query construction
    expect(db.select).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(AttendanceTable);
    expect(mockWhere).toHaveBeenCalled();
    expect(mockGroupBy).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  test('limits results to 5 reasons', async () => {
    const { mockLimit } = mockSelectSuccess(MOCK_ABSENCE_REASONS);

    await getMostCommonAbsenceReasons(MOCK_TEAM.team_id, Interval.THIS_MONTH);

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
        Interval.THIS_MONTH,
      );

      expect(result).toEqual([]);
    },
  );
});
