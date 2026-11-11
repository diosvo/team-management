import { forbidden } from 'next/navigation';
import { omit } from 'es-toolkit';

import { MatchStatus } from '@/utils/enum';

import type { MatchSearchParams } from '@/lib/nuqs';

import { revalidate } from '@/actions/cache';
import {
  deleteMatch,
  insertMatch,
  selectMatches,
  selectMatchOwnership,
  selectMatchPlayerStats,
  selectPlayedMatches,
  updateMatch,
  upsertMatchPlayerStats,
} from '@/db/match';
import { getDbErrorMessage } from '@/db/pg-error';
import { selectTeamPlayerIds } from '@/db/player';
import type {
  SaveMatchPlayerStatsValues,
  UpsertMatchSchemaValues,
} from '@/schemas/match';
import { MOCK_DATE_RANGE } from '@/test/mocks/analytics';
import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import {
  MOCK_MATCH,
  MOCK_MATCH_INPUT,
  MOCK_MATCH_RESPONSE,
} from '@/test/mocks/match';
import { MOCK_USER } from '@/test/mocks/user';

import {
  canEditMatchStats,
  getMatches,
  getMatchPlayerStats,
  getPlayedMatches,
  removeMatch,
  saveMatchPlayerStats,
  upsertMatch,
} from './match';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/match', () => ({
  selectMatches: vi.fn(),
  insertMatch: vi.fn(),
  updateMatch: vi.fn(),
  deleteMatch: vi.fn(),
  selectPlayedMatches: vi.fn(),
  selectMatchOwnership: vi.fn(),
  selectMatchPlayerStats: vi.fn(),
  upsertMatchPlayerStats: vi.fn(),
}));

vi.mock('@/db/player', () => ({
  selectTeamPlayerIds: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    matches: vi.fn(),
    matchStats: vi.fn(),
  },
}));

const MOCK_MATCH_ID = MOCK_MATCH.match_id;

describe('permissions', () => {
  test('scopes to the matches resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('matches');
  });

  test('upsertMatch requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeMatch requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('Match Actions', () => {
  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMatches', () => {
    const mockParams: MatchSearchParams = {
      game_type: ['true'],
      ...MOCK_DATE_RANGE,
      match_type: [],
      status: [],
      page: 1,
      q: '',
    };

    test('calls getMatches with params', async () => {
      vi.mocked(selectMatches).mockResolvedValue(MOCK_MATCH_RESPONSE);

      const result = await getMatches(mockParams);

      expect(selectMatches).toHaveBeenCalledWith({
        ...mockParams,
        team_id: MOCK_USER.team_id,
      });
      expect(result).toEqual(MOCK_MATCH_RESPONSE);
    });

    test('returns empty response when no matches exist', async () => {
      const emptyResponse = {
        stats: {
          total_matches: 0,
          played_matches: 0,
          win_streak: 0,
          avg_win_rate: 0,
          avg_points_per_game: 0,
        },
        data: [],
      };
      vi.mocked(selectMatches).mockResolvedValue(emptyResponse);

      const result = await getMatches(mockParams);
      expect(result).toEqual(emptyResponse);
    });

    test('propagates errors from getMatches', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(selectMatches).mockRejectedValue(error);

      await expect(getMatches(mockParams)).rejects.toThrow(message);
    });
  });

  describe('upsertMatch', () => {
    // The form values of the mock match (`home_team` comes from the session).
    const matchData = omit(MOCK_MATCH_INPUT, [
      'home_team',
    ]) as UpsertMatchSchemaValues;

    test('updates existing match and revalidates cache', async () => {
      vi.mocked(updateMatch).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertMatch(MOCK_MATCH_ID, matchData);

      expect(updateMatch).toHaveBeenCalledWith(MOCK_MATCH_ID, matchData);
      expect(insertMatch).not.toHaveBeenCalled();
      expect(revalidate.matches).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated match successfully',
      });
    });

    test('inserts new match when match_id is empty', async () => {
      vi.mocked(insertMatch).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertMatch('', matchData);

      expect(insertMatch).toHaveBeenCalledWith({
        ...matchData,
        home_team: MOCK_USER.team_id,
      });
      expect(updateMatch).not.toHaveBeenCalled();
      expect(revalidate.matches).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added match successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateMatch).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertMatch(MOCK_MATCH_ID, matchData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.matches).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('returns error response when insert fails', async () => {
      const errorMessage = 'Insert failed';
      vi.mocked(insertMatch).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertMatch('', matchData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.matches).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Unique constraint violation';
      vi.mocked(updateMatch).mockRejectedValue({
        code: '23505',
        detail: 'Duplicate key',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'unique_match_date',
      });

      const result = await upsertMatch(MOCK_MATCH_ID, matchData);

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });

  describe('removeMatch', () => {
    test('deletes match successfully and revalidates cache', async () => {
      vi.mocked(deleteMatch).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeMatch(MOCK_MATCH_ID);

      expect(deleteMatch).toHaveBeenCalledWith(MOCK_MATCH_ID);
      expect(revalidate.matches).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Deleted match successfully',
      });
    });

    test('returns error response when delete fails', async () => {
      vi.mocked(deleteMatch).mockRejectedValue(new Error('Delete failed'));

      const result = await removeMatch(MOCK_MATCH_ID);

      expect(deleteMatch).toHaveBeenCalledWith(MOCK_MATCH_ID);
      expect(revalidate.matches).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Failed to delete match',
      });
    });

    test('handles non-error exceptions', async () => {
      vi.mocked(deleteMatch).mockRejectedValue('Unknown error');

      const result = await removeMatch(MOCK_MATCH_ID);

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete match',
      });
    });
  });

  describe('canEditMatchStats', () => {
    test('returns true for an authorized user', async () => {
      await expect(canEditMatchStats()).resolves.toBe(true);
    });
  });

  describe('getPlayedMatches', () => {
    test("reads the caller's team completed matches", async () => {
      vi.mocked(selectPlayedMatches).mockResolvedValue([]);

      await expect(getPlayedMatches()).resolves.toEqual([]);
      expect(selectPlayedMatches).toHaveBeenCalledWith(MOCK_USER.team_id);
    });
  });

  describe('getMatchPlayerStats', () => {
    test('reads the box score of an own match', async () => {
      vi.mocked(selectMatchOwnership).mockResolvedValue({
        home_team: MOCK_USER.team_id,
        status: MatchStatus.COMPLETED,
      });
      vi.mocked(selectMatchPlayerStats).mockResolvedValue([]);

      await expect(getMatchPlayerStats(MOCK_MATCH_ID)).resolves.toEqual([]);
      expect(selectMatchPlayerStats).toHaveBeenCalledWith(
        MOCK_MATCH_ID,
        MOCK_USER.team_id,
      );
    });

    test.each([
      [
        'another team',
        { home_team: 'team-other', status: MatchStatus.COMPLETED },
      ],
      ['an unknown match', null],
    ])('forbids reading %s', async (_, ownership) => {
      vi.mocked(selectMatchOwnership).mockResolvedValue(ownership as never);

      await expect(getMatchPlayerStats(MOCK_MATCH_ID)).rejects.toThrow(
        'FORBIDDEN',
      );
      expect(forbidden).toHaveBeenCalled();
      expect(selectMatchPlayerStats).not.toHaveBeenCalled();
    });
  });

  describe('saveMatchPlayerStats', () => {
    const MATCH_UUID = '3f1c7a52-8f4e-4d6b-9a2c-1e5b7d9f0a11';
    const values = {
      match_id: MATCH_UUID,
      rows: [
        { player_id: 'player-1', points_scored: 12, rebounds: 4 },
        { player_id: 'player-2', assists: 6 },
      ],
      removed_player_ids: ['player-3', 'player-1'],
    } as unknown as SaveMatchPlayerStatsValues;

    beforeEach(() => {
      vi.mocked(selectMatchOwnership).mockResolvedValue({
        home_team: MOCK_USER.team_id,
        status: MatchStatus.COMPLETED,
      });
      vi.mocked(selectTeamPlayerIds).mockResolvedValue([
        'player-1',
        'player-2',
        'player-3',
      ]);
    });

    test('saves the box score and revalidates', async () => {
      const result = await saveMatchPlayerStats(values);

      expect(selectTeamPlayerIds).toHaveBeenCalledWith(MOCK_USER.team_id, [
        'player-1',
        'player-2',
        'player-3',
      ]);
      expect(upsertMatchPlayerStats).toHaveBeenCalledWith(
        MATCH_UUID,
        MOCK_USER.team_id,
        [
          expect.objectContaining({
            player_id: 'player-1',
            points_scored: 12,
            rebounds: 4,
            assists: 0,
          }),
          expect.objectContaining({ player_id: 'player-2', assists: 6 }),
        ],
        ['player-3', 'player-1'],
      );
      expect(revalidate.matchStats).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Saved box score for 2 players',
      });
    });

    test('rejects values that fail validation', async () => {
      const result = await saveMatchPlayerStats({
        ...values,
        match_id: 'not-a-uuid',
      });

      expect(selectMatchOwnership).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid box score. Check the values.',
      });
    });

    test("forbids saving another team's match", async () => {
      vi.mocked(selectMatchOwnership).mockResolvedValue(null as never);

      await expect(saveMatchPlayerStats(values)).rejects.toThrow('FORBIDDEN');
      expect(upsertMatchPlayerStats).not.toHaveBeenCalled();
    });

    test('refuses a match that is not completed', async () => {
      vi.mocked(selectMatchOwnership).mockResolvedValue({
        home_team: MOCK_USER.team_id,
        status: MatchStatus.SCHEDULED,
      });

      const result = await saveMatchPlayerStats(values);

      expect(upsertMatchPlayerStats).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Only a completed match can have a box score.',
      });
    });

    test('forbids players outside the team', async () => {
      vi.mocked(selectTeamPlayerIds).mockResolvedValue(['player-1']);

      await expect(saveMatchPlayerStats(values)).rejects.toThrow('FORBIDDEN');
      expect(upsertMatchPlayerStats).not.toHaveBeenCalled();
    });

    test('returns the database error when saving fails', async () => {
      vi.mocked(upsertMatchPlayerStats).mockRejectedValue(new Error('boom'));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Database error',
        constraint: null,
      });

      const result = await saveMatchPlayerStats(values);

      expect(revalidate.matchStats).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, message: 'Database error' });
    });
  });
});
