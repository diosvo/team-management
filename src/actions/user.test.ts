import { revalidate } from '@/actions/cache';
import auth from '@/lib/auth';
import {
  AddUserValues,
  EditPersonalInfoValues,
  EditTeamInfoValues,
} from '@/schemas/user';
import { CoachPosition, PlayerPosition, UserRole } from '@/utils/enum';

import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';
import {
  MOCK_COACH,
  MOCK_PLAYER,
  MOCK_USER,
  MOCK_USER_INPUT,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';

import { insertCoach, updateCoach } from '@/db/coach';
import { getDbErrorMessage } from '@/db/pg-error';
import { insertPlayer, updatePlayer } from '@/db/player';
import {
  deleteUser as deleteDbUser,
  fetchActivePlayers,
  getUsers as getDbUsers,
  getUserById,
  updateUser as updateDbUser,
} from '@/db/user';

import {
  addUser,
  getActivePlayers,
  getRoster,
  getUserProfile,
  removeUser,
  updatePersonalInfo,
  updateTeamInfo,
} from './user';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/user', () => ({
  fetchActivePlayers: vi.fn(),
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('@/db/coach', () => ({
  insertCoach: vi.fn(),
  updateCoach: vi.fn(),
}));

vi.mock('@/db/player', () => ({
  insertPlayer: vi.fn(),
  updatePlayer: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    roster: vi.fn(),
    user: vi.fn(),
  },
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  default: {
    api: {
      signUpEmail: vi.fn(),
      requestPasswordReset: vi.fn(),
    },
  },
}));

describe('User Actions', () => {
  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };
  const errorMessage = 'An error occurred';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActivePlayers', () => {
    test('calls fetchActivePlayers with team_id', async () => {
      vi.mocked(fetchActivePlayers).mockResolvedValue([MOCK_USER_WITH_PLAYER]);

      const result = await getActivePlayers();

      expect(fetchActivePlayers).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual([MOCK_USER_WITH_PLAYER]);
    });
  });

  describe('getRoster', () => {
    test('calls getUsers with team_id', async () => {
      const mockUsers = [MOCK_USER_WITH_PLAYER, MOCK_USER_WITH_COACH];
      vi.mocked(getDbUsers).mockResolvedValue(mockUsers);

      const result = await getRoster();

      expect(getDbUsers).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserProfile', () => {
    test('returns target user and viewOnly flag for own profile', async () => {
      vi.mocked(getUserById).mockResolvedValue(MOCK_USER_WITH_PLAYER);

      const result = await getUserProfile(MOCK_USER_WITH_PLAYER.id);

      expect(getUserById).toHaveBeenCalledWith(MOCK_USER_WITH_PLAYER.id);
      expect(result).toEqual({
        targetUser: MOCK_USER_WITH_PLAYER,
        viewOnly: false,
      });
    });

    test('throws NOT_FOUND when user does not exist', async () => {
      vi.mocked(getUserById).mockResolvedValue(null);

      await expect(getUserProfile('invalid-id')).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('addUser', () => {
    const newUser = {
      id: 'new-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      email: MOCK_USER.email,
      emailVerified: false,
      name: MOCK_USER.name,
      image: null,
      role: UserRole.PLAYER,
      state: MOCK_USER.state,
      team_id: MOCK_TEAM.team_id,
    };
    const newPlayerData: AddUserValues = {
      ...MOCK_USER_INPUT,
      role: UserRole.PLAYER,
      position: PlayerPosition.POINT_GUARD,
    };

    test('adds player user successfully', async () => {
      vi.mocked(auth.api.signUpEmail).mockResolvedValue({
        user: newUser,
        token: null,
      });
      vi.mocked(insertPlayer).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });
      vi.mocked(auth.api.requestPasswordReset).mockResolvedValue(
        expect.anything(),
      );

      const result = await addUser(newPlayerData);

      expect(auth.api.signUpEmail).toHaveBeenCalled();
      expect(insertPlayer).toHaveBeenCalledWith({
        id: 'new-user-id',
        position: newPlayerData.position,
      });
      expect(auth.api.requestPasswordReset).toHaveBeenCalled();
      expect(revalidate.roster).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Sent an email to with instructions',
      });
    });

    test('adds coach user successfully', async () => {
      vi.mocked(auth.api.signUpEmail).mockResolvedValue({
        user: newUser,
        token: null,
      });
      vi.mocked(insertCoach).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });
      vi.mocked(auth.api.requestPasswordReset).mockResolvedValue(
        expect.anything(),
      );

      const result = await addUser({
        ...MOCK_USER_INPUT,
        role: UserRole.COACH,
        position: CoachPosition.HEAD_COACH,
      });

      expect(insertCoach).toHaveBeenCalledWith({
        id: 'new-user-id',
        position: CoachPosition.HEAD_COACH,
      });
      expect(revalidate.roster).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('returns error when signup fails', async () => {
      vi.mocked(auth.api.signUpEmail).mockRejectedValue(
        new Error(errorMessage),
      );
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await addUser(newPlayerData);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe('updatePersonalInfo', () => {
    const personalInfoData: EditPersonalInfoValues = {
      name: 'Nhung Vo',
      dob: '1999-01-01',
    };

    test('updates personal info successfully', async () => {
      vi.mocked(updateDbUser).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await updatePersonalInfo(MOCK_USER.id, personalInfoData);

      expect(updateDbUser).toHaveBeenCalledWith(MOCK_USER.id, personalInfoData);
      expect(revalidate.user).toHaveBeenCalledWith(MOCK_USER.id);
      expect(result).toEqual({
        success: true,
        message: 'Updated personal information successfully',
      });
    });

    test('returns error when update fails', async () => {
      vi.mocked(updateDbUser).mockRejectedValue(new Error(errorMessage));

      const result = await updatePersonalInfo(MOCK_USER.id, personalInfoData);

      expect(result.success).toBe(false);
      expect(revalidate.user).not.toHaveBeenCalled();
    });
  });

  describe('updateTeamInfo', () => {
    const teamInfoData: EditTeamInfoValues = {
      user: {
        role: MOCK_USER.role,
        state: MOCK_USER.state,
        join_date: MOCK_USER.join_date,
      },
      player: {
        jersey_number: MOCK_PLAYER.jersey_number,
        position: MOCK_PLAYER.position,
      },
      coach: {
        position: MOCK_COACH.position,
      },
    };

    test('updates team info for player successfully', async () => {
      vi.mocked(updateDbUser).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });
      vi.mocked(updatePlayer).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await updateTeamInfo(MOCK_PLAYER.id, teamInfoData);

      expect(updateDbUser).toHaveBeenCalledWith(
        MOCK_PLAYER.id,
        teamInfoData.user,
      );
      expect(updatePlayer).toHaveBeenCalledWith({
        id: MOCK_PLAYER.id,
        ...teamInfoData.player,
      });
      expect(revalidate.user).toHaveBeenCalledWith(MOCK_PLAYER.id);
      expect(result).toEqual({
        success: true,
        message: 'Updated team information successfully',
      });
    });

    test('updates team info for coach successfully', async () => {
      const coachInfoData: EditTeamInfoValues = {
        ...teamInfoData,
        user: {
          ...teamInfoData.user,
          role: UserRole.COACH,
        },
      };
      vi.mocked(updateDbUser).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });
      vi.mocked(updatePlayer).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await updateTeamInfo(MOCK_COACH.id, coachInfoData);

      expect(updateDbUser).toHaveBeenCalledWith(
        MOCK_COACH.id,
        coachInfoData.user,
      );
      expect(updateCoach).toHaveBeenCalledWith({
        id: MOCK_COACH.id,
        ...coachInfoData.coach,
      });
      expect(revalidate.user).toHaveBeenCalledWith(MOCK_COACH.id);
      expect(result).toEqual({
        success: true,
        message: 'Updated team information successfully',
      });
    });

    test('handles jersey number constraint error', async () => {
      vi.mocked(updateDbUser).mockRejectedValue(new Error(errorMessage));
      vi.mocked(updatePlayer).mockRejectedValue({
        code: '23505',
        detail: 'Key (jersey_number)=(9) already exists.',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Duplicate key',
        constraint: 'player_jersey_number_unique',
      });

      const result = await updateTeamInfo(MOCK_USER.id, teamInfoData);

      expect(result).toEqual({
        success: false,
        message: "Jersey number '9' is already taken",
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateDbUser).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await updateTeamInfo(MOCK_USER.id, teamInfoData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.user).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe('removeUser', () => {
    test('deletes user successfully', async () => {
      vi.mocked(deleteDbUser).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeUser(MOCK_USER.id);

      expect(deleteDbUser).toHaveBeenCalledWith(MOCK_USER.id);
      expect(revalidate.roster).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
    });

    test('returns error when delete fails', async () => {
      vi.mocked(deleteDbUser).mockRejectedValue(new Error('Delete failed'));

      const result = await removeUser(MOCK_USER.id);

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete user',
      });
    });
  });
});
