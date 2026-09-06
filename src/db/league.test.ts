import { and, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import {
  type InsertLeague,
  LeagueTable,
  LeagueTeamRosterTable,
  LeagueTeamTable,
} from '@/drizzle/schema/league';
import type { UpsertLeagueSchemaValues } from '@/schemas/league';
import { AchievementType, LeagueStatus } from '@/utils/enum';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertReturningFailure,
  mockInsertReturningSuccess,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_LEAGUE, MOCK_LEAGUE_INPUT } from '@/test/mocks/league';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_PLAYER, MOCK_USER } from '@/test/mocks/user';

import {
  addPlayerToLeagueRoster,
  deleteLeague,
  getLeagueById,
  getLeagues,
  getPlayersInLeague,
  insertLeague,
  registerTeamInLeague,
  removePlayerFromLeagueRoster,
  updateLeague,
} from './league';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      LeagueTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      LeagueTeamRosterTable: {
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

vi.mock('@/drizzle/schema/league', () => ({
  LeagueTable: {
    league_id: 'league_id',
    end_date: 'end_date',
  },
  LeagueTeamRosterTable: {
    team_id: 'team_id',
    league_id: 'league_id',
    player_id: 'player_id',
  },
  LeagueTeamTable: {
    team_id: 'team_id',
    league_id: 'league_id',
  },
}));

describe('getLeagues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns leagues with player count and achievement types when database query succeeds', async () => {
    const mockLeagueData = {
      ...MOCK_LEAGUE,
      team_rosters: [
        { league_id: MOCK_LEAGUE.league_id },
        { league_id: MOCK_LEAGUE.league_id },
      ],
      achievements: [
        { type: AchievementType.CHAMPION },
        { type: AchievementType.MVP },
      ],
    };
    vi.mocked(db.query.LeagueTable.findMany).mockResolvedValue([
      mockLeagueData,
    ]);

    const result = await getLeagues();

    const { team_rosters, achievements, ...league } = mockLeagueData;
    expect(result).toEqual([
      {
        ...league,
        player_count: 2,
        achievement_type: [AchievementType.CHAMPION, AchievementType.MVP],
      },
    ]);
    // Validate query construction
    expect(db.query.LeagueTable.findMany).toHaveBeenCalledWith({
      orderBy: desc(LeagueTable.end_date),
      with: {
        team_rosters: {
          columns: { league_id: true },
        },
        achievements: {
          columns: { type: true },
        },
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
    'returns empty array when database query $description',
    async ({ mockError }) => {
      vi.mocked(db.query.LeagueTable.findMany).mockRejectedValue(mockError);

      const result = await getLeagues();
      expect(result).toEqual([]);
    },
  );
});

describe('getLeagueById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each([
    {
      description: 'has not started',
      start_date: '2099-01-01',
      end_date: '2099-12-31',
      expected: LeagueStatus.UPCOMING,
    },
    {
      description: 'is running',
      start_date: '2020-01-01',
      end_date: '2099-12-31',
      expected: LeagueStatus.ONGOING,
    },
    {
      description: 'is over',
      start_date: '2020-01-01',
      end_date: '2020-12-31',
      expected: LeagueStatus.ENDED,
    },
  ])(
    'derives $expected status when the league $description',
    async ({ start_date, end_date, expected }) => {
      vi.mocked(db.query.LeagueTable.findFirst).mockResolvedValue({
        ...MOCK_LEAGUE,
        start_date,
        end_date,
      });

      const result = await getLeagueById(MOCK_LEAGUE.league_id);

      expect(result?.status).toBe(expected);
    },
  );

  test('returns undefined when the league does not exist', async () => {
    vi.mocked(db.query.LeagueTable.findFirst).mockResolvedValue(undefined);

    const result = await getLeagueById(MOCK_LEAGUE.league_id);

    expect(result).toBeUndefined();
    expect(eq).toHaveBeenCalledWith(
      LeagueTable.league_id,
      MOCK_LEAGUE.league_id,
    );
  });
});

describe('getPlayersInLeague', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns players in league when database query succeeds', async () => {
    // TS can't automatically detect the extended type is because Drizzle's relational queries are runtime-based.
    // The with option is evaluated at runtime, and TS doesn't have built-in type inference for this dynamic relation loading.
    vi.mocked(db.query.LeagueTeamRosterTable.findMany).mockResolvedValue([
      {
        player: {
          ...MOCK_PLAYER,
          user: MOCK_USER,
        },
      },
    ] as any);

    const result = await getPlayersInLeague(
      MOCK_TEAM.team_id,
      MOCK_LEAGUE.league_id,
    );

    expect(result).toEqual([MOCK_USER]);
    // Verify query construction
    expect(db.query.LeagueTeamRosterTable.findMany).toHaveBeenCalledWith({
      columns: {},
      where: and(
        eq(LeagueTeamRosterTable.team_id, MOCK_TEAM.team_id),
        eq(LeagueTeamRosterTable.league_id, MOCK_LEAGUE.league_id),
      ),
      with: {
        player: {
          with: {
            user: true,
          },
        },
      },
    });
  });

  test('returns empty array when database query fails', async () => {
    const error = new Error('Database error');
    vi.mocked(db.query.LeagueTeamRosterTable.findMany).mockRejectedValue(error);

    const result = await getPlayersInLeague(
      MOCK_TEAM.team_id,
      MOCK_LEAGUE.league_id,
    );

    expect(result).toEqual([]);
  });
});

describe('insertLeague', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts league successfully', async () => {
    const { mockValues, mockReturning } = mockInsertReturningSuccess([
      { league_id: MOCK_LEAGUE.league_id },
    ]);

    const result = await insertLeague(MOCK_LEAGUE_INPUT);

    expect(result).toEqual([{ league_id: MOCK_LEAGUE.league_id }]);
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(LeagueTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_LEAGUE_INPUT);
    expect(mockReturning).toHaveBeenCalledWith({
      league_id: LeagueTable.league_id,
    });
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertReturningFailure(message);

    await expect(insertLeague({} as InsertLeague)).rejects.toThrow(message);
  });
});

describe('updateLeague', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates league successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess({
      league_id: MOCK_LEAGUE.league_id,
    });

    const result = await updateLeague(
      MOCK_LEAGUE.league_id,
      MOCK_LEAGUE_INPUT as UpsertLeagueSchemaValues,
    );

    expect(result).toEqual({ league_id: MOCK_LEAGUE.league_id });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(LeagueTable);
    expect(mockSet).toHaveBeenCalledWith(MOCK_LEAGUE_INPUT);
    expect(eq).toHaveBeenCalledWith(
      LeagueTable.league_id,
      MOCK_LEAGUE.league_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: LeagueTable.league_id,
      value: MOCK_LEAGUE.league_id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateLeague(
        MOCK_LEAGUE.league_id,
        MOCK_LEAGUE_INPUT as UpsertLeagueSchemaValues,
      ),
    ).rejects.toThrow(message);
  });
});

describe('deleteLeague', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes league successfully', async () => {
    const mockWhere = mockDeleteSuccess({ league_id: MOCK_LEAGUE.league_id });

    const result = await deleteLeague(MOCK_LEAGUE.league_id);

    expect(result).toEqual({ league_id: MOCK_LEAGUE.league_id });
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(LeagueTable);
    expect(eq).toHaveBeenCalledWith(
      LeagueTable.league_id,
      MOCK_LEAGUE.league_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: LeagueTable.league_id,
      value: MOCK_LEAGUE.league_id,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Update failed';
    mockDeleteFailure(message);

    await expect(deleteLeague(MOCK_LEAGUE.league_id)).rejects.toThrow(message);
  });
});

describe('registerTeamInLeague', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockOnConflictInsert(returnValue: unknown) {
    const mockOnConflictDoNothing = vi.fn().mockResolvedValue(returnValue);
    const mockValues = vi
      .fn()
      .mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });

    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as unknown as ReturnType<typeof db.insert>);

    return { mockValues, mockOnConflictDoNothing };
  }

  test('enters the team into the league, ignoring a pair that already exists', async () => {
    const { mockValues, mockOnConflictDoNothing } = mockOnConflictInsert({
      rowCount: 0,
    });

    const result = await registerTeamInLeague(
      MOCK_LEAGUE.league_id,
      MOCK_TEAM.team_id,
    );

    expect(result).toEqual({ rowCount: 0 });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(LeagueTeamTable);
    expect(mockValues).toHaveBeenCalledWith({
      league_id: MOCK_LEAGUE.league_id,
      team_id: MOCK_TEAM.team_id,
    });
    expect(mockOnConflictDoNothing).toHaveBeenCalled();
  });

  test('throws error when the insert fails', async () => {
    const message = 'Insert failed';
    const mockValues = vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockRejectedValue(new Error(message)),
    });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as unknown as ReturnType<typeof db.insert>);

    await expect(
      registerTeamInLeague(MOCK_LEAGUE.league_id, MOCK_TEAM.team_id),
    ).rejects.toThrow(message);
  });
});

describe('addPlayerToLeagueRoster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('adds player to league roster successfully', async () => {
    const mockValues = mockInsertSuccess({ team_id: MOCK_TEAM.team_id });

    const result = await addPlayerToLeagueRoster(
      MOCK_TEAM.team_id,
      MOCK_LEAGUE.league_id,
      MOCK_PLAYER.id,
    );

    expect(result).toEqual({ team_id: MOCK_TEAM.team_id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(LeagueTeamRosterTable);
    expect(mockValues).toHaveBeenCalledWith({
      team_id: MOCK_TEAM.team_id,
      league_id: MOCK_LEAGUE.league_id,
      player_id: MOCK_PLAYER.id,
    });
  });

  test('throws error when adding player fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(
      addPlayerToLeagueRoster(
        MOCK_TEAM.team_id,
        MOCK_LEAGUE.league_id,
        MOCK_PLAYER.id,
      ),
    ).rejects.toThrow(message);
  });
});

describe('removePlayerFromLeagueRoster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('removes player from league roster successfully', async () => {
    const mockWhere = mockDeleteSuccess({ team_id: MOCK_TEAM.team_id });

    const result = await removePlayerFromLeagueRoster(
      MOCK_TEAM.team_id,
      MOCK_LEAGUE.league_id,
      MOCK_PLAYER.id,
    );

    expect(result).toEqual({ team_id: MOCK_TEAM.team_id });
    expect(db.delete).toHaveBeenCalledWith(LeagueTeamRosterTable);
    expect(and).toHaveBeenCalledWith(
      {
        field: LeagueTeamRosterTable.team_id,
        value: MOCK_TEAM.team_id,
        type: 'eq',
      },
      {
        field: LeagueTeamRosterTable.league_id,
        value: MOCK_LEAGUE.league_id,
        type: 'eq',
      },
      {
        field: LeagueTeamRosterTable.player_id,
        value: MOCK_PLAYER.id,
        type: 'eq',
      },
    );
    expect(mockWhere).toHaveBeenCalledWith([
      {
        field: LeagueTeamRosterTable.team_id,
        value: MOCK_TEAM.team_id,
        type: 'eq',
      },
      {
        field: LeagueTeamRosterTable.league_id,
        value: MOCK_LEAGUE.league_id,
        type: 'eq',
      },
      {
        field: LeagueTeamRosterTable.player_id,
        value: MOCK_PLAYER.id,
        type: 'eq',
      },
    ]);
  });

  test('throws error when removing player fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(
      removePlayerFromLeagueRoster(
        MOCK_TEAM.team_id,
        MOCK_LEAGUE.league_id,
        MOCK_PLAYER.id,
      ),
    ).rejects.toThrow(message);
  });
});
