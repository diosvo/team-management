import {
  addPlayerToLeagueRoster,
  deleteLeague,
  getLeagues as fetchLeagues,
  getPlayersInLeague as fetchPlayersInLeague,
  insertLeague,
  registerTeamInLeague,
  removePlayerFromLeagueRoster,
  updateLeague,
} from '@/db/league';
import { getDbErrorMessage } from '@/db/pg-error';
import { getTeamPlayerIds } from '@/db/player';

import { revalidate } from '@/actions/cache';
import { UpsertLeagueSchemaValues } from '@/schemas/league';

import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import { MOCK_LEAGUE, MOCK_LEAGUE_INPUT } from '@/test/mocks/league';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_USER } from '@/test/mocks/user';

import {
  getLeagues,
  getPlayersInLeague,
  removeLeague,
  upsertLeague,
} from './league';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/league', () => ({
  getLeagues: vi.fn(),
  getPlayersInLeague: vi.fn(),
  insertLeague: vi.fn(),
  updateLeague: vi.fn(),
  deleteLeague: vi.fn(),
  registerTeamInLeague: vi.fn(),
  addPlayerToLeagueRoster: vi.fn(),
  removePlayerFromLeagueRoster: vi.fn(),
}));

vi.mock('@/db/player', () => ({
  getTeamPlayerIds: vi.fn(),
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    leagues: vi.fn(),
  },
}));

describe('permissions', () => {
  test('scopes to the leagues resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('leagues');
  });

  test('upsertLeague requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeLeague requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('League Actions', () => {
  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };
  const errorMessage = 'An error occurred';
  const leagueDetails = {
    ...MOCK_LEAGUE,
    player_count: 0,
    achievement_type: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDbErrorMessage).mockReturnValue({
      message: errorMessage,
      constraint: null,
    });
    // By default every requested player is on the acting user's team.
    vi.mocked(getTeamPlayerIds).mockImplementation(async (_, ids) => ids);
  });

  describe('getLeagues', () => {
    test('fetches leagues successfully', async () => {
      vi.mocked(fetchLeagues).mockResolvedValue([leagueDetails]);

      const result = await getLeagues();

      expect(fetchLeagues).toHaveBeenCalled();
      expect(result).toEqual([leagueDetails]);
    });

    test('returns empty array when fetchLeagues returns empty array', async () => {
      vi.mocked(fetchLeagues).mockResolvedValue([]);

      const result = await getLeagues();
      expect(result).toEqual([]);
    });
  });

  describe('getPlayersInLeague', () => {
    test('calls fetchPlayersInLeague with team_id and league_id', async () => {
      vi.mocked(fetchPlayersInLeague).mockResolvedValue([MOCK_USER]);

      const result = await getPlayersInLeague(MOCK_LEAGUE.league_id);

      expect(fetchPlayersInLeague).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        MOCK_LEAGUE.league_id,
      );
      expect(result).toEqual([MOCK_USER]);
    });

    test('returns empty array when no players found', async () => {
      vi.mocked(fetchPlayersInLeague).mockResolvedValue([]);

      const result = await getPlayersInLeague(MOCK_LEAGUE.league_id);
      expect(result).toEqual([]);
    });
  });

  describe('upsertLeague', () => {
    const leagueData = MOCK_LEAGUE_INPUT as UpsertLeagueSchemaValues;
    const insertReturn = [{ league_id: MOCK_LEAGUE.league_id }];
    const updateReturn = { ...mockResult, command: 'UPDATE' };

    describe('insert new league', () => {
      test('creates a new league from the submitted fields only', async () => {
        vi.mocked(insertLeague).mockResolvedValue(insertReturn);

        const result = await upsertLeague('', leagueData, []);

        expect(insertLeague).toHaveBeenCalledWith(leagueData);
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Added league successfully',
        });
      });

      test('enters the acting team into the new league', async () => {
        vi.mocked(insertLeague).mockResolvedValue(insertReturn);

        await upsertLeague('', leagueData, []);

        expect(registerTeamInLeague).toHaveBeenCalledWith(
          MOCK_LEAGUE.league_id,
          MOCK_TEAM.team_id,
        );
      });

      test('returns error when insert fails', async () => {
        vi.mocked(insertLeague).mockRejectedValue(new Error(errorMessage));

        const result = await upsertLeague('', leagueData, []);

        expect(insertLeague).toHaveBeenCalled();
        expect(getDbErrorMessage).toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          message: errorMessage,
        });
      });
    });

    describe('update existing league', () => {
      test('updates existing league from the submitted fields only', async () => {
        vi.mocked(updateLeague).mockResolvedValue(updateReturn);

        const result = await upsertLeague(
          MOCK_LEAGUE.league_id,
          leagueData,
          [],
        );

        expect(updateLeague).toHaveBeenCalledWith(
          MOCK_LEAGUE.league_id,
          leagueData,
        );
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Updated league successfully',
        });
      });

      test('returns error when update fails', async () => {
        vi.mocked(updateLeague).mockRejectedValue(new Error(errorMessage));

        const result = await upsertLeague(
          MOCK_LEAGUE.league_id,
          leagueData,
          [],
        );

        expect(updateLeague).toHaveBeenCalled();
        expect(getDbErrorMessage).toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          message: errorMessage,
        });
      });

      test('syncs roster by adding and removing players on update', async () => {
        vi.mocked(updateLeague).mockResolvedValue(updateReturn);
        vi.mocked(fetchPlayersInLeague).mockResolvedValue([
          { ...MOCK_USER, id: 'player-old' },
          { ...MOCK_USER, id: 'player-keep' },
        ]);

        const result = await upsertLeague(MOCK_LEAGUE.league_id, leagueData, [
          'player-keep',
          'player-new',
        ]);

        expect(fetchPlayersInLeague).toHaveBeenCalledWith(
          MOCK_TEAM.team_id,
          MOCK_LEAGUE.league_id,
        );
        expect(addPlayerToLeagueRoster).toHaveBeenCalledWith(
          MOCK_TEAM.team_id,
          MOCK_LEAGUE.league_id,
          'player-new',
        );
        expect(removePlayerFromLeagueRoster).toHaveBeenCalledWith(
          MOCK_TEAM.team_id,
          MOCK_LEAGUE.league_id,
          'player-old',
        );
        expect(result).toEqual({
          success: true,
          message: 'Updated league successfully',
        });
      });

      test('rejects players who are not on the acting team', async () => {
        vi.mocked(updateLeague).mockResolvedValue(updateReturn);
        vi.mocked(fetchPlayersInLeague).mockResolvedValue([]);
        vi.mocked(getTeamPlayerIds).mockResolvedValue(['player-ours-123']);

        const result = await upsertLeague(MOCK_LEAGUE.league_id, leagueData, [
          'player-ours-123',
          'player-theirs-456',
        ]);

        expect(getTeamPlayerIds).toHaveBeenCalledWith(MOCK_TEAM.team_id, [
          'player-ours-123',
          'player-theirs-456',
        ]);
        expect(addPlayerToLeagueRoster).toHaveBeenCalledExactlyOnceWith(
          MOCK_TEAM.team_id,
          MOCK_LEAGUE.league_id,
          'player-ours-123',
        );
        expect(result).toEqual({
          success: false,
          message: 'Player (id: player-t) is not on this team',
        });
        expect(revalidate.leagues).not.toHaveBeenCalled();
      });

      test('returns roster sync error message when add/remove operations fail', async () => {
        vi.mocked(updateLeague).mockResolvedValue(updateReturn);
        vi.mocked(fetchPlayersInLeague).mockResolvedValue([
          { ...MOCK_USER, id: 'player-old-id-123' },
        ]);
        vi.mocked(addPlayerToLeagueRoster).mockRejectedValueOnce(
          new Error('add failed'),
        );
        vi.mocked(removePlayerFromLeagueRoster).mockRejectedValueOnce(
          new Error('remove failed'),
        );
        vi.mocked(getDbErrorMessage)
          .mockReturnValueOnce({
            message: 'Add player failed',
            constraint: null,
          })
          .mockReturnValueOnce({
            message: 'Remove player failed',
            constraint: null,
          });

        const result = await upsertLeague(MOCK_LEAGUE.league_id, leagueData, [
          'player-new-id-456',
        ]);

        expect(result).toEqual({
          success: false,
          message:
            'Add player failed (id: player-n)\nFailed to remove player (id: player-o) - Remove player failed',
        });
        expect(revalidate.leagues).not.toHaveBeenCalled();
      });
    });
  });

  describe('removeLeague', () => {
    test('deletes league successfully', async () => {
      vi.mocked(deleteLeague).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeLeague(MOCK_LEAGUE.league_id);

      expect(deleteLeague).toHaveBeenCalledWith(MOCK_LEAGUE.league_id);
      expect(revalidate.leagues).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Deleted league successfully',
      });
    });

    test('returns error message when delete fails', async () => {
      vi.mocked(deleteLeague).mockRejectedValue(new Error(errorMessage));

      const result = await removeLeague(MOCK_LEAGUE.league_id);

      expect(deleteLeague).toHaveBeenCalledWith(MOCK_LEAGUE.league_id);
      expect(result).toEqual({
        success: false,
        message: 'Failed to delete asset',
      });
    });
  });
});
