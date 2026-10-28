import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
} from 'drizzle-orm';

import db from '@/drizzle';
import { type InsertMatch, MatchTable } from '@/drizzle/schema';

import type { MatchSearchParams } from '@/lib/nuqs';
import type { UpsertMatchSchemaValues } from '@/schemas/match';
import { MatchResult, MatchStatus, MatchType } from '@/utils/enum';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockSelectFailure,
  mockSelectSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_DATE_RANGE } from '@/test/mocks/analytics';
import { MOCK_MATCH, MOCK_MATCH_INPUT } from '@/test/mocks/match';
import { MOCK_AWAY_TEAM, MOCK_TEAM } from '@/test/mocks/team';

import {
  countTeamMatches,
  deleteMatch,
  getMatches,
  insertMatch,
  updateMatch,
} from './match';
import { withinRange } from './utils';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      MatchTable: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(),
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
    home_team: 'home_team',
    away_team: 'away_team',
    is_5x5: 'is_5x5',
    league_id: 'league_id',
    date: 'date',
    status: 'status',
    updated_at: 'updated_at',
  },
}));

describe('getMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams: MatchSearchParams & { team_id: string } = {
    team_id: MOCK_TEAM.team_id,
    game_type: ['true'],
    ...MOCK_DATE_RANGE,
    match_type: [],
    status: [],
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

    expect(result).toEqual({
      stats: {
        total_matches: 2,
        played_matches: 2,
        win_streak: 1,
        avg_win_rate: 50,
        avg_points_per_game: 84.5,
      },
      data: [
        { ...mockMatchData[0], result: MatchResult.LOSS },
        { ...mockMatchData[1], result: MatchResult.WIN },
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
        eq(MatchTable.home_team, MOCK_TEAM.team_id),
        eq(MatchTable.is_5x5, true),
        withinRange(MatchTable.date, MOCK_DATE_RANGE),
      ),
      orderBy: desc(MatchTable.date),
    });
  });

  test('marks a completed match with an equal score as a draw', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([
      {
        ...MOCK_MATCH,
        home_team: MOCK_TEAM.team_id,
        away_team: MOCK_AWAY_TEAM.team_id,
        home_team_score: 80,
        away_team_score: 80,
      },
    ]);

    const result = await getMatches(mockParams);

    expect(result.data[0].result).toBe(MatchResult.DRAW);
  });

  test('filters league matches when type is league', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    await getMatches({ ...mockParams, match_type: [MatchType.LEAGUE] });

    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(MatchTable.home_team, MOCK_TEAM.team_id),
          eq(MatchTable.is_5x5, true),
          withinRange(MatchTable.date, MOCK_DATE_RANGE),
          isNotNull(MatchTable.league_id),
        ),
      }),
    );
  });

  test('filters friendly matches when type is friendly', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    await getMatches({ ...mockParams, match_type: [MatchType.FRIENDLY] });

    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(MatchTable.home_team, MOCK_TEAM.team_id),
          eq(MatchTable.is_5x5, true),
          withinRange(MatchTable.date, MOCK_DATE_RANGE),
          isNull(MatchTable.league_id),
        ),
      }),
    );
  });

  test('skips the is_5x5 filter when no game_type is selected', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    await getMatches({ ...mockParams, game_type: [] });

    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(MatchTable.home_team, MOCK_TEAM.team_id),
          withinRange(MatchTable.date, MOCK_DATE_RANGE),
        ),
      }),
    );
  });

  test('skips the is_5x5 filter when both game types are selected', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    await getMatches({ ...mockParams, game_type: ['true', 'false'] });

    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(MatchTable.home_team, MOCK_TEAM.team_id),
          withinRange(MatchTable.date, MOCK_DATE_RANGE),
        ),
      }),
    );
  });

  test('skips the league_id filter when both match types are selected', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    await getMatches({
      ...mockParams,
      match_type: [MatchType.LEAGUE, MatchType.FRIENDLY],
    });

    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(MatchTable.home_team, MOCK_TEAM.team_id),
          eq(MatchTable.is_5x5, true),
          withinRange(MatchTable.date, MOCK_DATE_RANGE),
        ),
      }),
    );
  });

  test('narrows to the selected statuses', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    await getMatches({ ...mockParams, status: [MatchStatus.SCHEDULED] });

    expect(db.query.MatchTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(MatchTable.home_team, MOCK_TEAM.team_id),
          eq(MatchTable.is_5x5, true),
          withinRange(MatchTable.date, MOCK_DATE_RANGE),
          inArray(MatchTable.status, [MatchStatus.SCHEDULED]),
        ),
      }),
    );
  });

  test('leaves an unplayed match without a result and out of the stats', async () => {
    const mockMatchData = [
      {
        ...MOCK_MATCH,
        status: MatchStatus.COMPLETED,
        home_team_score: 90,
        away_team_score: 85,
      },
      // 0-0 because it has not been played, not because it was a draw.
      {
        ...MOCK_MATCH,
        status: MatchStatus.SCHEDULED,
        home_team_score: 0,
        away_team_score: 0,
      },
      {
        ...MOCK_MATCH,
        status: MatchStatus.CANCELLED,
        home_team_score: 0,
        away_team_score: 0,
      },
    ];
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue(mockMatchData);

    const result = await getMatches(mockParams);

    expect(result.data.map(({ result }) => result)).toEqual([
      MatchResult.WIN,
      null,
      null,
    ]);
    expect(result.stats).toEqual({
      total_matches: 3,
      played_matches: 1,
      win_streak: 1,
      avg_win_rate: 100,
      avg_points_per_game: 90,
    });
  });

  test('returns empty stats when no matches exist', async () => {
    vi.mocked(db.query.MatchTable.findMany).mockResolvedValue([]);

    const result = await getMatches(mockParams);

    expect(result).toEqual({
      stats: {
        total_matches: 0,
        played_matches: 0,
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
          played_matches: 0,
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

describe('countTeamMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('counts the matches a team plays on either side', async () => {
    const { mockFrom, mockWhere } = mockSelectSuccess([{ total: 3 }]);

    await expect(countTeamMatches(MOCK_TEAM.team_id)).resolves.toBe(3);

    expect(db.select).toHaveBeenCalledWith({ total: count() });
    expect(mockFrom).toHaveBeenCalledWith(MatchTable);
    expect(mockWhere).toHaveBeenCalledWith(
      or(
        eq(MatchTable.home_team, MOCK_TEAM.team_id),
        eq(MatchTable.away_team, MOCK_TEAM.team_id),
      ),
    );
  });

  test('returns 0 when the query yields no row', async () => {
    mockSelectSuccess([]);

    await expect(countTeamMatches(MOCK_TEAM.team_id)).resolves.toBe(0);
  });

  test('propagates a database error to the caller', async () => {
    mockSelectFailure('Count failed');

    await expect(countTeamMatches(MOCK_TEAM.team_id)).rejects.toThrow(
      'Count failed',
    );
  });
});
