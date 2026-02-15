import { isFuture, isPast } from 'date-fns';

import {
  addPlayerToLeagueRoster,
  deleteLeague,
  getLeagues as fetchLeagues,
  getPlayersInLeague as fetchPlayersInLeague,
  insertLeague,
  updateLeague,
} from '@/db/league';
import { getDbErrorMessage } from '@/db/pg-error';

import { revalidate } from '@/actions/cache';
import { UpsertLeagueSchemaValues } from '@/schemas/league';
import { LeagueStatus } from '@/utils/enum';

import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_LEAGUE, MOCK_LEAGUE_INPUT } from '@/test/mocks/league';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_USER, MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';

import {
  getLeagues,
  getPlayersInLeague,
  removeLeague,
  upsertLeague,
  upsertPlayerToLeague,
} from './league';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/league', () => ({
  getLeagues: vi.fn(),
  getPlayersInLeague: vi.fn(),
  insertLeague: vi.fn(),
  updateLeague: vi.fn(),
  deleteLeague: vi.fn(),
  addPlayerToLeagueRoster: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    leagues: vi.fn(),
  },
}));

vi.mock('date-fns', () => ({
  isFuture: vi.fn(),
  isPast: vi.fn(),
}));

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
    team_rosters: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
    const insertReturn = { ...mockResult, command: 'INSERT' };
    const updateReturn = { ...mockResult, command: 'UPDATE' };

    describe('insert new league', () => {
      test('creates new league with UPCOMING status when start date is in future', async () => {
        vi.mocked(isFuture).mockReturnValue(true);
        vi.mocked(isPast).mockReturnValue(false);
        vi.mocked(insertLeague).mockResolvedValue(insertReturn);

        const result = await upsertLeague('', leagueData);

        expect(isFuture).toHaveBeenCalledWith(leagueData.start_date);
        expect(insertLeague).toHaveBeenCalledWith({
          ...leagueData,
          team_id: MOCK_TEAM.team_id,
          status: LeagueStatus.UPCOMING,
        });
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Added league successfully',
        });
      });

      test('creates new league with ENDED status when end date is in past', async () => {
        vi.mocked(isFuture).mockReturnValue(false);
        vi.mocked(isPast).mockReturnValue(true);
        vi.mocked(insertLeague).mockResolvedValue(insertReturn);

        const result = await upsertLeague('', leagueData);

        expect(isPast).toHaveBeenCalledWith(leagueData.end_date);
        expect(insertLeague).toHaveBeenCalledWith({
          ...leagueData,
          team_id: MOCK_TEAM.team_id,
          status: LeagueStatus.ENDED,
        });
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Added league successfully',
        });
      });

      test('creates new league with ONGOING status when dates are current', async () => {
        vi.mocked(isFuture).mockReturnValue(false);
        vi.mocked(isPast).mockReturnValue(false);
        vi.mocked(insertLeague).mockResolvedValue(insertReturn);

        const result = await upsertLeague('', leagueData);

        expect(insertLeague).toHaveBeenCalledWith({
          ...leagueData,
          team_id: MOCK_TEAM.team_id,
          status: LeagueStatus.ONGOING,
        });
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Added league successfully',
        });
      });

      test('returns error when insert fails', async () => {
        vi.mocked(isFuture).mockReturnValue(false);
        vi.mocked(isPast).mockReturnValue(false);
        vi.mocked(insertLeague).mockRejectedValue(new Error(errorMessage));
        vi.mocked(getDbErrorMessage).mockReturnValue({
          message: errorMessage,
          constraint: null,
        });

        const result = await upsertLeague('', leagueData);

        expect(insertLeague).toHaveBeenCalled();
        expect(getDbErrorMessage).toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          message: errorMessage,
        });
      });
    });

    describe('update existing league', () => {
      test('updates existing league with UPCOMING status', async () => {
        vi.mocked(isFuture).mockReturnValue(true);
        vi.mocked(isPast).mockReturnValue(false);
        vi.mocked(updateLeague).mockResolvedValue(updateReturn);

        const result = await upsertLeague(MOCK_LEAGUE.league_id, leagueData);

        expect(updateLeague).toHaveBeenCalledWith(MOCK_LEAGUE.league_id, {
          ...MOCK_LEAGUE_INPUT,
          team_id: MOCK_TEAM.team_id,
          status: LeagueStatus.UPCOMING,
        });
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Updated league successfully',
        });
      });

      test('updates existing league with ENDED status', async () => {
        vi.mocked(isFuture).mockReturnValue(false);
        vi.mocked(isPast).mockReturnValue(true);
        vi.mocked(updateLeague).mockResolvedValue(updateReturn);

        const result = await upsertLeague(MOCK_LEAGUE.league_id, leagueData);

        expect(updateLeague).toHaveBeenCalledWith(MOCK_LEAGUE.league_id, {
          ...leagueData,
          team_id: MOCK_TEAM.team_id,
          status: LeagueStatus.ENDED,
        });
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Updated league successfully',
        });
      });

      test('updates existing league with ONGOING status', async () => {
        vi.mocked(isFuture).mockReturnValue(false);
        vi.mocked(isPast).mockReturnValue(false);
        vi.mocked(updateLeague).mockResolvedValue(updateReturn);

        const result = await upsertLeague(MOCK_LEAGUE.league_id, leagueData);

        expect(updateLeague).toHaveBeenCalledWith(MOCK_LEAGUE.league_id, {
          ...leagueData,
          team_id: MOCK_TEAM.team_id,
          status: LeagueStatus.ONGOING,
        });
        expect(revalidate.leagues).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Updated league successfully',
        });
      });

      test('returns error when update fails', async () => {
        vi.mocked(isFuture).mockReturnValue(false);
        vi.mocked(isPast).mockReturnValue(false);
        vi.mocked(updateLeague).mockRejectedValue(new Error(errorMessage));
        vi.mocked(getDbErrorMessage).mockReturnValue({
          message: errorMessage,
          constraint: null,
        });

        const result = await upsertLeague(MOCK_LEAGUE.league_id, leagueData);

        expect(updateLeague).toHaveBeenCalled();
        expect(getDbErrorMessage).toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          message: errorMessage,
        });
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

  describe('upsertPlayerToLeague', () => {
    const playerId = MOCK_USER_WITH_PLAYER.id;

    test('adds player to league roster successfully', async () => {
      vi.mocked(addPlayerToLeagueRoster).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertPlayerToLeague(
        MOCK_LEAGUE.league_id,
        playerId,
      );

      expect(addPlayerToLeagueRoster).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        MOCK_LEAGUE.league_id,
        playerId,
      );
      expect(result).toEqual({
        success: true,
        message: 'Added player to league roster',
      });
    });

    test('returns error with short player id when add fails', async () => {
      const shortId = playerId.slice(0, 8);
      vi.mocked(addPlayerToLeagueRoster).mockRejectedValue(
        new Error(errorMessage),
      );
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertPlayerToLeague(
        MOCK_LEAGUE.league_id,
        playerId,
      );

      expect(addPlayerToLeagueRoster).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        MOCK_LEAGUE.league_id,
        playerId,
      );
      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: `${errorMessage} (id: ${shortId})`,
      });
    });

    test('handles duplicate player error with formatted message', async () => {
      const shortId = playerId.slice(0, 8);
      const duplicateError = 'Duplicate player';
      vi.mocked(addPlayerToLeagueRoster).mockRejectedValue(
        new Error(duplicateError),
      );
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: duplicateError,
        constraint: 'league_roster_player_unique',
      });

      const result = await upsertPlayerToLeague(
        MOCK_LEAGUE.league_id,
        playerId,
      );

      expect(result).toEqual({
        success: false,
        message: `${duplicateError} (id: ${shortId})`,
      });
    });
  });
});
