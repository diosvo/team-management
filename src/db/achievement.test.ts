import { asc, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { AchievementTable } from '@/drizzle/schema/achievement';
import { UpsertAchievementSchemaValues } from '@/schemas/achievement';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertReturningFailure,
  mockInsertReturningSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_ACHIEVEMENT, MOCK_ACHIEVEMENT_INPUT } from '@/test/mocks/achievement';

import {
  deleteAchievement,
  getAchievements,
  getPlayerLeagueStatSuggestions,
  insertAchievement,
  updateAchievement,
} from './achievement';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      AchievementTable: {
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

vi.mock('@/drizzle/schema/achievement', () => ({
  AchievementTable: {
    achievement_id: 'achievement_id',
    type: 'type',
    year: 'year',
    created_at: 'created_at',
  },
}));

vi.mock('@/drizzle/schema/match', () => ({
  MatchTable: {
    match_id: 'match_id',
    league_id: 'league_id',
  },
  MatchPlayerStatsTable: {
    match_id: 'match_id',
    player_id: 'player_id',
    points_scored: 'points_scored',
  },
}));

vi.mock('@/drizzle/schema/user', () => ({
  UserTable: {
    id: 'id',
    name: 'name',
  },
}));

describe('getAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns achievements with relations when database query succeeds', async () => {
    const achievementDetails = {
      ...MOCK_ACHIEVEMENT,
      league: { name: 'Summer League' },
      player: null,
    };
    vi.mocked(db.query.AchievementTable.findMany).mockResolvedValue([
      achievementDetails,
    ] as any);

    const result = await getAchievements();

    expect(result).toEqual([achievementDetails]);
    // Validate query construction
    expect(db.query.AchievementTable.findMany).toHaveBeenCalledWith({
      orderBy: [
        desc(AchievementTable.year),
        asc(AchievementTable.type),
        desc(AchievementTable.created_at),
      ],
      with: {
        league: {
          columns: { name: true, start_date: true, end_date: true },
        },
        player: {
          columns: { id: true },
          with: {
            user: { columns: { id: true, name: true, image: true } },
          },
        },
      },
    });
  });

  test('returns empty array when database query fails', async () => {
    vi.mocked(db.query.AchievementTable.findMany).mockRejectedValue(
      new Error('Database error'),
    );

    const result = await getAchievements();
    expect(result).toEqual([]);
  });
});

describe('insertAchievement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts achievement successfully', async () => {
    const { mockValues, mockReturning } = mockInsertReturningSuccess([
      { achievement_id: MOCK_ACHIEVEMENT.achievement_id },
    ]);

    const result = await insertAchievement(MOCK_ACHIEVEMENT_INPUT);

    expect(result).toEqual([
      { achievement_id: MOCK_ACHIEVEMENT.achievement_id },
    ]);
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(AchievementTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_ACHIEVEMENT_INPUT);
    expect(mockReturning).toHaveBeenCalledWith({
      achievement_id: AchievementTable.achievement_id,
    });
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertReturningFailure(message);

    await expect(insertAchievement(MOCK_ACHIEVEMENT_INPUT)).rejects.toThrow(
      message,
    );
  });
});

describe('updateAchievement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates achievement successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess({
      achievement_id: MOCK_ACHIEVEMENT.achievement_id,
    });

    const result = await updateAchievement(
      MOCK_ACHIEVEMENT.achievement_id,
      MOCK_ACHIEVEMENT_INPUT as UpsertAchievementSchemaValues,
    );

    expect(result).toEqual({
      achievement_id: MOCK_ACHIEVEMENT.achievement_id,
    });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(AchievementTable);
    expect(mockSet).toHaveBeenCalledWith(MOCK_ACHIEVEMENT_INPUT);
    expect(mockWhere).toHaveBeenCalledWith(
      eq(AchievementTable.achievement_id, MOCK_ACHIEVEMENT.achievement_id),
    );
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateAchievement(
        MOCK_ACHIEVEMENT.achievement_id,
        MOCK_ACHIEVEMENT_INPUT as UpsertAchievementSchemaValues,
      ),
    ).rejects.toThrow(message);
  });
});

describe('deleteAchievement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes achievement successfully', async () => {
    const mockWhere = mockDeleteSuccess({
      achievement_id: MOCK_ACHIEVEMENT.achievement_id,
    });

    const result = await deleteAchievement(MOCK_ACHIEVEMENT.achievement_id);

    expect(result).toEqual({
      achievement_id: MOCK_ACHIEVEMENT.achievement_id,
    });
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(AchievementTable);
    expect(mockWhere).toHaveBeenCalledWith(
      eq(AchievementTable.achievement_id, MOCK_ACHIEVEMENT.achievement_id),
    );
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(
      deleteAchievement(MOCK_ACHIEVEMENT.achievement_id),
    ).rejects.toThrow(message);
  });
});

describe('getPlayerLeagueStatSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const suggestions = [
    {
      player_id: 'player-123',
      player_name: 'Player Name',
      games_played: 8,
      avg_points: 18.2,
    },
  ];

  function mockSuggestionQuery(result: unknown, fails = false) {
    const mockLimit = fails
      ? vi.fn().mockRejectedValue(new Error('Database error'))
      : vi.fn().mockResolvedValue(result);
    const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
    const mockGroupBy = vi.fn(() => ({ orderBy: mockOrderBy }));
    const mockWhere = vi.fn(() => ({ groupBy: mockGroupBy }));
    const mockSecondJoin = vi.fn(() => ({ where: mockWhere }));
    const mockFirstJoin = vi.fn(() => ({ innerJoin: mockSecondJoin }));
    const mockFrom = vi.fn(() => ({ innerJoin: mockFirstJoin }));

    vi.mocked(db.select).mockReturnValueOnce({
      from: mockFrom,
    } as unknown as ReturnType<typeof db.select>);

    return { mockFrom, mockWhere, mockGroupBy, mockOrderBy, mockLimit };
  }

  test('returns top players by average points for the league', async () => {
    const { mockLimit } = mockSuggestionQuery(suggestions);

    const result = await getPlayerLeagueStatSuggestions('league-123');

    expect(result).toEqual(suggestions);
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  test('returns empty array when database query fails', async () => {
    mockSuggestionQuery(null, true);

    const result = await getPlayerLeagueStatSuggestions('league-123');
    expect(result).toEqual([]);
  });
});
