import { revalidate } from '@/actions/cache';
import {
  deleteMatch,
  getMatches as getDbMatches,
  insertMatch as insertDbMatch,
  updateMatch as updateDbMatch,
} from '@/db/match';
import { getDbErrorMessage } from '@/db/pg-error';

import { UpsertMatchSchemaValues } from '@/schemas/match';
import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_USER } from '@/test/mocks/user';
import { MatchSearchParams } from '@/utils/filters';

import { getMatches, removeMatch, upsertMatch } from './match';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/match', () => ({
  getMatches: vi.fn(),
  insertMatch: vi.fn(),
  updateMatch: vi.fn(),
  deleteMatch: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    matches: vi.fn(),
  },
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
}));

const MOCK_MATCH_RESPONSE = {
  stats: {
    total_matches: 2,
    win_streak: 1,
    avg_win_rate: 50,
    avg_points_per_game: 87.5,
  },
  data: [
    {
      match_id: 'match-1',
      home_team_score: 85,
      away_team_score: 80,
      result: 'WIN',
    },
    {
      match_id: 'match-2',
      home_team_score: 75,
      away_team_score: 80,
      result: 'LOSS',
    },
  ],
};

const MOCK_MATCH_ID = 'match-123';

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
      is5x5: true,
      interval: 'THIS_MONTH',
      page: 1,
      q: '',
    };

    test('calls getMatches with params', async () => {
      vi.mocked(getDbMatches).mockResolvedValue(MOCK_MATCH_RESPONSE);

      const result = await getMatches(mockParams);

      expect(getDbMatches).toHaveBeenCalledWith(mockParams);
      expect(result).toEqual(MOCK_MATCH_RESPONSE);
    });

    test('returns empty response when no matches exist', async () => {
      const emptyResponse = {
        stats: {
          total_matches: 0,
          win_streak: 0,
          avg_win_rate: 0,
          avg_points_per_game: 0,
        },
        data: [],
      };
      vi.mocked(getDbMatches).mockResolvedValue(emptyResponse);

      const result = await getMatches(mockParams);
      expect(result).toEqual(emptyResponse);
    });

    test('propagates errors from getMatches', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(getDbMatches).mockRejectedValue(error);

      await expect(getMatches(mockParams)).rejects.toThrow(message);
    });
  });

  describe('upsertMatch', () => {
    const matchData: UpsertMatchSchemaValues = {
      is_5x5: true,
      league_id: 'league-123',
      location_id: 'location-123',
      date: '2024-01-20',
      time: '19:00',
      away_team: 'team-away',
      home_team_score: 85,
      away_team_score: 80,
    };

    test('updates existing match and revalidates cache', async () => {
      vi.mocked(updateDbMatch).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertMatch(MOCK_MATCH_ID, matchData);

      expect(updateDbMatch).toHaveBeenCalledWith(MOCK_MATCH_ID, matchData);
      expect(insertDbMatch).not.toHaveBeenCalled();
      expect(revalidate.matches).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated match successfully',
      });
    });

    test('inserts new match when match_id is empty', async () => {
      vi.mocked(insertDbMatch).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertMatch('', matchData);

      expect(insertDbMatch).toHaveBeenCalledWith({
        ...matchData,
        home_team: MOCK_USER.team_id,
      });
      expect(updateDbMatch).not.toHaveBeenCalled();
      expect(revalidate.matches).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added match successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateDbMatch).mockRejectedValue(new Error(errorMessage));
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
      vi.mocked(insertDbMatch).mockRejectedValue(new Error(errorMessage));
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
      vi.mocked(updateDbMatch).mockRejectedValue({
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
});
