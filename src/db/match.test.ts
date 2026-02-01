import { and, desc, eq, gte, lte } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertMatch, MatchTable } from '@/drizzle/schema';

import { UpsertMatchSchemaValues } from '@/schemas/match';
import { Interval, MatchStatus } from '@/utils/enum';
import { MatchSearchParams } from '@/utils/filters';
import { TIME_DURATION } from '@/utils/formatter';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_MATCH, MOCK_MATCH_INPUT } from '@/test/mocks/match';
import { MOCK_AWAY_TEAM, MOCK_TEAM } from '@/test/mocks/team';

import { deleteMatch, getMatches, insertMatch, updateMatch } from './match';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      MatchTable: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

vi.mock('@/drizzle/schema', () => ({
  MatchTable: {
    match_id: 'match_id',
    is_5x5: 'is_5x5',
    date: 'date',
    updated_at: 'updated_at',
  },
}));

describe('getMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams: MatchSearchParams = {
    is5x5: true,
    interval: Interval.THIS_MONTH,
    page: 1,
    q: '',
  };

  test('returns matches with stats when database query succeeds', async () => {
    const mockMatchData = [
      {
        ...MOCK_MATCH,
        home_team: MOCK_TEAM.team_id,
        away_team: MOCK_AWAY_TEAM.team_id,
        home_team_score: 79,
        away_team_score: 80,
      },
      {
        ...MOCK_MATCH,
        home_team: MOCK_TEAM.team_id,
        away_team: MOCK_AWAY_TEAM.team_id,
        home_team_score: 90,
        away_team_score: 85,
      },
    ];
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue(mockMatchData);

    const result = await getMatches(mockParams);

    const { start, end } = TIME_DURATION[mockParams.interval];

    expect(result).toEqual({
      stats: {
        total_matches: 2,
        win_streak: 1,
        avg_win_rate: 50,
        avg_points_per_game: 84.5,
      },
      data: [
        { ...mockMatchData[0], result: MatchStatus.LOSS },
        { ...mockMatchData[1], result: MatchStatus.WIN },
      ],
    });
    // Verify query construction
    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith({
      with: {
        home_team: { columns: { team_id: true, name: true } },
        away_team: { columns: { team_id: true, name: true } },
        league: { columns: { name: true } },
        location: { columns: { name: true } },
      },
      where: and(
        eq(MatchTable.is_5x5, true),
        gte(MatchTable.date, start.toISOString()),
        lte(MatchTable.date, end.toISOString()),
      ),
      orderBy: desc(MatchTable.updated_at),
    });
  });

  test('returns empty stats when no matches exist', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    const result = await getMatches(mockParams);

    expect(result).toEqual({
      stats: {
        total_matches: 0,
        win_streak: 0,
        avg_win_rate: 0,
        avg_points_per_game: 0,
      },
      data: [],
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
      vi.mocked(db.query.MatchTable.findMany).mockRejectedValue(mockError);

      const result = await getMatches(mockParams);

      expect(result).toEqual({
        stats: {
          total_matches: 0,
          win_streak: 0,
          avg_win_rate: 0,
          avg_points_per_game: 0,
        },
        data: [],
      });
    },
  );
});

describe('insertMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts match successfully', async () => {
    const mockValues = mockInsertSuccess({ match_id: MOCK_MATCH.match_id });

    const result = await insertMatch(MOCK_MATCH_INPUT);

    expect(result).toEqual({ match_id: MOCK_MATCH.match_id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(MatchTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_MATCH_INPUT);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(insertMatch({} as InsertMatch)).rejects.toThrow(message);
  });
});

describe('updateMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates match successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess({
      match_id: MOCK_MATCH.match_id,
    });

    const result = await updateMatch(
      MOCK_MATCH.match_id,
      MOCK_MATCH_INPUT as UpsertMatchSchemaValues,
    );

    expect(result).toEqual({ match_id: MOCK_MATCH.match_id });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(MatchTable);
    expect(mockSet).toHaveBeenCalledWith(MOCK_MATCH_INPUT);
    expect(eq).toHaveBeenCalledWith(MatchTable.match_id, MOCK_MATCH.match_id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: MatchTable.match_id,
      value: MOCK_MATCH.match_id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateMatch(
        MOCK_MATCH.match_id,
        MOCK_MATCH_INPUT as UpsertMatchSchemaValues,
      ),
    ).rejects.toThrow(message);
  });
});

describe('deleteMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes match successfully', async () => {
    const mockWhere = mockDeleteSuccess({ match_id: MOCK_MATCH.match_id });

    const result = await deleteMatch(MOCK_MATCH.match_id);

    expect(result).toEqual({ match_id: MOCK_MATCH.match_id });
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(MatchTable);
    expect(eq).toHaveBeenCalledWith(MatchTable.match_id, MOCK_MATCH.match_id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: MatchTable.match_id,
      value: MOCK_MATCH.match_id,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(deleteMatch(MOCK_MATCH.match_id)).rejects.toThrow(message);
  });
});
