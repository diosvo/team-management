import { and, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import {
  InsertLeague,
  LeagueTable,
  LeagueTeamRosterTable,
} from '@/drizzle/schema/league';
import { UpsertLeagueSchemaValues } from '@/schemas/league';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
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
  getLeagues,
  getPlayersInLeague,
  insertLeague,
  updateLeague,
} from './league';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      LeagueTable: {
        findMany: vi.fn(),
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
}));

describe('getLeagues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns leagues with player count when database query succeeds', async () => {
    const mockLeagueData = {
      ...MOCK_LEAGUE,
      team_rosters: [
        { league_id: MOCK_LEAGUE.league_id },
        { league_id: MOCK_LEAGUE.league_id },
      ],
    };
    vi.mocked(db.query.LeagueTable.findMany).mockResolvedValue([
      mockLeagueData,
    ]);

    const result = await getLeagues();

    expect(result).toEqual([
      {
        ...mockLeagueData,
        player_count: 2,
      },
    ]);
    // Validate query construction
    expect(db.query.LeagueTable.findMany).toHaveBeenCalledWith({
      orderBy: desc(LeagueTable.end_date),
      with: {
        team_rosters: {
          columns: { league_id: true },
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
    const mockValues = mockInsertSuccess({ league_id: MOCK_LEAGUE.league_id });

    const result = await insertLeague(MOCK_LEAGUE_INPUT);

    expect(result).toEqual({ league_id: MOCK_LEAGUE.league_id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(LeagueTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_LEAGUE_INPUT);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

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
