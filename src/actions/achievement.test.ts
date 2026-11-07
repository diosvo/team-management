import { isPast } from 'date-fns';

import { revalidate } from '@/actions/cache';
import {
  deleteAchievement,
  insertAchievement,
  selectAchievements,
  selectPlayerLeagueStatSuggestions,
  updateAchievement,
} from '@/db/achievement';
import { selectLeagueById } from '@/db/league';
import { getDbErrorMessage } from '@/db/pg-error';
import type { UpsertAchievementSchemaValues } from '@/schemas/achievement';
import {
  MOCK_ACHIEVEMENT,
  MOCK_ACHIEVEMENT_INPUT,
} from '@/test/mocks/achievement';
import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import { MOCK_LEAGUE } from '@/test/mocks/league';

import {
  getAchievements,
  getPlayerLeagueStatSuggestions,
  removeAchievement,
  upsertAchievement,
} from './achievement';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/achievement', () => ({
  selectAchievements: vi.fn(),
  selectPlayerLeagueStatSuggestions: vi.fn(),
  insertAchievement: vi.fn(),
  updateAchievement: vi.fn(),
  deleteAchievement: vi.fn(),
}));

vi.mock('@/db/league', () => ({
  selectLeagueById: vi.fn(),
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    achievements: vi.fn(),
  },
}));

vi.mock('date-fns', () => ({
  isPast: vi.fn(),
}));

describe('permissions', () => {
  test('scopes to the achievements resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('achievements');
  });

  test('upsertAchievement requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeAchievement requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('Achievement Actions', () => {
  const errorMessage = 'An error occurred';
  const achievementData =
    MOCK_ACHIEVEMENT_INPUT as UpsertAchievementSchemaValues;
  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDbErrorMessage).mockReturnValue({
      message: errorMessage,
      constraint: null,
    });
  });

  describe('getAchievements', () => {
    test('fetches achievements successfully', async () => {
      const achievementDetails = {
        ...MOCK_ACHIEVEMENT,
        league: null,
        player: null,
      };
      vi.mocked(selectAchievements).mockResolvedValue([achievementDetails]);

      const result = await getAchievements();

      expect(selectAchievements).toHaveBeenCalledWith('sgr');
      expect(result).toEqual([achievementDetails]);
    });
  });

  describe('getPlayerLeagueStatSuggestions', () => {
    test('fetches suggestions for the given league', async () => {
      const suggestions = [
        {
          player_id: 'player-123',
          player_name: 'Player Name',
          games_played: 8,
          avg_points: 18.2,
        },
      ];
      vi.mocked(selectPlayerLeagueStatSuggestions).mockResolvedValue(
        suggestions,
      );

      const result = await getPlayerLeagueStatSuggestions(
        MOCK_LEAGUE.league_id,
      );

      expect(selectPlayerLeagueStatSuggestions).toHaveBeenCalledWith(
        MOCK_LEAGUE.league_id,
      );
      expect(result).toEqual(suggestions);
    });
  });

  describe('upsertAchievement', () => {
    describe('ended-league enforcement', () => {
      test('returns error when the league does not exist', async () => {
        vi.mocked(selectLeagueById).mockResolvedValue(undefined);

        const result = await upsertAchievement('', achievementData);

        expect(selectLeagueById).toHaveBeenCalledWith(
          achievementData.league_id,
        );
        expect(insertAchievement).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          message: 'League not found',
        });
      });

      test('returns error when the league has not ended yet', async () => {
        vi.mocked(selectLeagueById).mockResolvedValue(MOCK_LEAGUE);
        vi.mocked(isPast).mockReturnValue(false);

        const result = await upsertAchievement('', achievementData);

        expect(isPast).toHaveBeenCalledWith(MOCK_LEAGUE.end_date);
        expect(insertAchievement).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          message: 'Achievements can only be recorded for ended leagues',
        });
      });

      test('accepts a league whose end date has passed', async () => {
        vi.mocked(selectLeagueById).mockResolvedValue(MOCK_LEAGUE);
        vi.mocked(isPast).mockReturnValue(true);
        vi.mocked(insertAchievement).mockResolvedValue([
          { achievement_id: MOCK_ACHIEVEMENT.achievement_id },
        ]);

        const result = await upsertAchievement('', achievementData);

        expect(insertAchievement).toHaveBeenCalledWith({
          ...achievementData,
          team_id: 'sgr',
        });
        expect(revalidate.achievements).toHaveBeenCalled();
        expect(result).toEqual({
          success: true,
          message: 'Recorded achievement successfully',
        });
      });

      test('skips the league check for standalone achievements', async () => {
        const standalone = { ...achievementData, league_id: null };
        vi.mocked(insertAchievement).mockResolvedValue([
          { achievement_id: MOCK_ACHIEVEMENT.achievement_id },
        ]);

        const result = await upsertAchievement('', standalone);

        expect(selectLeagueById).not.toHaveBeenCalled();
        expect(insertAchievement).toHaveBeenCalledWith({
          ...standalone,
          team_id: 'sgr',
        });
        expect(result).toEqual({
          success: true,
          message: 'Recorded achievement successfully',
        });
      });
    });

    test('updates an existing achievement', async () => {
      vi.mocked(selectLeagueById).mockResolvedValue(MOCK_LEAGUE);
      vi.mocked(isPast).mockReturnValue(true);
      vi.mocked(updateAchievement).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertAchievement(
        MOCK_ACHIEVEMENT.achievement_id,
        achievementData,
      );

      expect(updateAchievement).toHaveBeenCalledWith(
        'sgr',
        MOCK_ACHIEVEMENT.achievement_id,
        achievementData,
      );
      expect(revalidate.achievements).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated achievement successfully',
      });
    });

    test('returns error when insert fails', async () => {
      vi.mocked(selectLeagueById).mockResolvedValue(MOCK_LEAGUE);
      vi.mocked(isPast).mockReturnValue(true);
      vi.mocked(insertAchievement).mockRejectedValue(new Error(errorMessage));

      const result = await upsertAchievement('', achievementData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.achievements).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe('removeAchievement', () => {
    test('deletes achievement successfully', async () => {
      vi.mocked(deleteAchievement).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeAchievement(MOCK_ACHIEVEMENT.achievement_id);

      expect(deleteAchievement).toHaveBeenCalledWith(
        'sgr',
        MOCK_ACHIEVEMENT.achievement_id,
      );
      expect(revalidate.achievements).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Deleted achievement successfully',
      });
    });

    test('returns error message when delete fails', async () => {
      vi.mocked(deleteAchievement).mockRejectedValue(new Error(errorMessage));

      const result = await removeAchievement(MOCK_ACHIEVEMENT.achievement_id);

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete achievement',
      });
    });
  });
});
