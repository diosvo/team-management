import { ESTABLISHED_DATE } from '@/utils/constants';
import { CoachPosition, PlayerPosition, UserRole } from '@/utils/enum';

import auth from '@/lib/auth';
import { deleteFile, getFile, uploadFile } from '@/lib/blob';

import { revalidate } from '@/actions/cache';
import { insertCoach } from '@/db/coach';
import { getDbErrorMessage } from '@/db/pg-error';
import { insertPlayer, isJerseyNumberTaken } from '@/db/player';
import {
  deleteUser,
  selectActivePlayers,
  selectRegistrationPlayers,
  selectRosterUsers,
  selectUserById,
  selectUsers,
  updateUser,
  updateUserTeamInfo,
} from '@/db/user';
import { insertMembership } from '@/db/user-team';
import type {
  AddUserValues,
  EditPersonalInfoValues,
  EditTeamInfoValues,
} from '@/schemas/user';
import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
  resetMockAuthUser,
  setMockAuthUser,
} from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';
import {
  MOCK_COACH,
  MOCK_PLAYER,
  MOCK_USER,
  MOCK_USER_INPUT,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';

import {
  createUser,
  getActivePlayers,
  getAvatar,
  getRegistrationPlayers,
  getRoster,
  getUserProfile,
  getUsers,
  removeUser,
  updatePersonalInfo,
  updateTeamInfo,
  uploadAvatar,
} from './user';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/user', () => ({
  selectActivePlayers: vi.fn(),
  selectRegistrationPlayers: vi.fn(),
  selectRosterUsers: vi.fn(),
  selectUsers: vi.fn(),
  selectUserById: vi.fn(),
  updateUser: vi.fn(),
  updateUserTeamInfo: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('@/db/user-team', () => ({
  insertMembership: vi.fn(),
}));

vi.mock('@/db/coach', () => ({
  insertCoach: vi.fn(),
}));

vi.mock('@/db/player', () => ({
  insertPlayer: vi.fn(),
  isJerseyNumberTaken: vi.fn(),
}));

vi.mock('@/lib/blob', () => ({
  getFile: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    roster: vi.fn(),
    user: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  default: {
    api: {
      signUpEmail: vi.fn(),
      requestPasswordReset: vi.fn(),
    },
  },
}));

describe('permissions', () => {
  test('scopes roster-related actions to the roster resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('roster');
  });

  test('scopes user-related actions to the profile resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('profile');
  });

  test('getRegistrationPlayers requires registration:create', () => {
    expect(mockWithResource).toHaveBeenCalledWith('registration');
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create'],
      expect.objectContaining({ name: 'registrationPlayers' }),
    );
  });

  test('createUser requires create action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create'],
      expect.objectContaining({ name: 'add' }),
    );
  });

  test('getAvatar requires view action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['view'],
      expect.objectContaining({ name: 'getAvatar' }),
    );
  });

  test('uploadAvatar requires edit action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['edit'],
      expect.objectContaining({ name: 'uploadAvatar' }),
    );
  });

  test('updatePersonalInfo requires edit action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['edit'],
      expect.objectContaining({ name: 'updatePersonal' }),
    );
  });

  test('updateTeamInfo requires edit action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['edit'],
      expect.objectContaining({ name: 'updateTeam' }),
    );
  });

  test('removeUser requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

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
      vi.mocked(selectActivePlayers).mockResolvedValue([MOCK_USER_WITH_PLAYER]);

      const result = await getActivePlayers();

      expect(selectActivePlayers).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual([MOCK_USER_WITH_PLAYER]);
    });

    test('returns an empty array without querying when the user has no team', async () => {
      setMockAuthUser({ ...MOCK_USER, team_id: '' });

      const result = await getActivePlayers();

      expect(result).toEqual([]);
      expect(selectActivePlayers).not.toHaveBeenCalled();

      resetMockAuthUser();
    });
  });

  describe('getRegistrationPlayers', () => {
    test('loads full rows for the selected ids within the team', async () => {
      vi.mocked(selectRegistrationPlayers).mockResolvedValue([
        MOCK_USER_WITH_PLAYER,
      ]);

      const result = await getRegistrationPlayers([MOCK_USER_WITH_PLAYER.id]);

      expect(selectRegistrationPlayers).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        [MOCK_USER_WITH_PLAYER.id],
      );
      expect(result).toEqual([MOCK_USER_WITH_PLAYER]);
    });

    test('returns an empty array when the user has no team', async () => {
      setMockAuthUser({ ...MOCK_USER, team_id: '' });

      const result = await getRegistrationPlayers(['user-1']);

      expect(result).toEqual([]);
      expect(selectRegistrationPlayers).not.toHaveBeenCalled();

      resetMockAuthUser();
    });
  });

  describe('getUsers', () => {
    test('calls getUsers with team_id', async () => {
      const mockUsers = [MOCK_USER_WITH_PLAYER, MOCK_USER_WITH_COACH];
      vi.mocked(selectUsers).mockResolvedValue(mockUsers);

      const result = await getUsers();

      expect(selectUsers).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getRoster', () => {
    test('calls getRosterUsers with team_id', async () => {
      const mockUsers = [MOCK_USER_WITH_PLAYER, MOCK_USER_WITH_COACH];
      vi.mocked(selectRosterUsers).mockResolvedValue(mockUsers);

      const result = await getRoster();

      expect(selectRosterUsers).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserProfile', () => {
    test('returns target user and viewOnly flag for own profile', async () => {
      vi.mocked(selectUserById).mockResolvedValue(MOCK_USER_WITH_PLAYER);

      const result = await getUserProfile(MOCK_USER_WITH_PLAYER.id);

      expect(selectUserById).toHaveBeenCalledWith(MOCK_USER_WITH_PLAYER.id);
      expect(result).toEqual({
        targetUser: MOCK_USER_WITH_PLAYER,
        viewOnly: false,
      });
    });

    test('throws NOT_FOUND when user does not exist', async () => {
      vi.mocked(selectUserById).mockResolvedValue(null);

      await expect(getUserProfile('invalid-id')).rejects.toThrow('NOT_FOUND');
    });

    test('forbids a guest from viewing any profile', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.GUEST });

      await expect(getUserProfile(MOCK_USER.id)).rejects.toThrow('FORBIDDEN');

      resetMockAuthUser();
    });

    test('is view-only when an admin views their own profile', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.SUPER_ADMIN });
      vi.mocked(selectUserById).mockResolvedValue({
        ...MOCK_USER_WITH_PLAYER,
        id: MOCK_USER.id,
      });

      const result = await getUserProfile(MOCK_USER.id);

      expect(result.viewOnly).toBe(true);

      resetMockAuthUser();
    });

    test('is view-only when a player views someone else’s profile', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.PLAYER });
      const otherUser = { ...MOCK_USER_WITH_COACH, id: 'someone-elses-id' };
      vi.mocked(selectUserById).mockResolvedValue(otherUser);

      const result = await getUserProfile(otherUser.id);

      expect(result.viewOnly).toBe(true);

      resetMockAuthUser();
    });

    test('is view-only when a coach views someone else’s profile', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.COACH });
      const otherUser = { ...MOCK_USER_WITH_COACH, id: 'someone-elses-id' };
      vi.mocked(selectUserById).mockResolvedValue(otherUser);

      const result = await getUserProfile(otherUser.id);

      expect(result.viewOnly).toBe(true);

      resetMockAuthUser();
    });
  });

  describe('createUser', () => {
    const newUser = {
      id: 'new-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      email: MOCK_USER.email,
      emailVerified: false,
      name: MOCK_USER.name,
      image: null,
      role: UserRole.PLAYER,
      is_captain: false,
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

      const result = await createUser(newPlayerData);

      expect(auth.api.signUpEmail).toHaveBeenCalled();
      expect(insertPlayer).toHaveBeenCalledWith({
        id: 'new-user-id',
        position: newPlayerData.position,
      });
      expect(auth.api.requestPasswordReset).toHaveBeenCalled();
      // The invite opens the user's first membership stint
      expect(insertMembership).toHaveBeenCalledWith(
        'new-user-id',
        MOCK_TEAM.team_id,
        newPlayerData.join_date,
      );
      expect(revalidate.roster).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Sent an email with instructions',
      });
    });

    test('opens the membership from the club founding date when join_date is omitted', async () => {
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

      await createUser({ ...newPlayerData, join_date: undefined as never });

      expect(insertMembership).toHaveBeenCalledWith(
        'new-user-id',
        MOCK_TEAM.team_id,
        ESTABLISHED_DATE,
      );
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

      const result = await createUser({
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

      const result = await createUser(newPlayerData);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe('getAvatar', () => {
    test('returns null without fetching when image path is null', async () => {
      const result = await getAvatar(null);

      expect(getFile).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('fetches the file for a given image path', async () => {
      const dataUrl = 'data:image/png;base64,abc';
      vi.mocked(getFile).mockResolvedValue(dataUrl);

      const result = await getAvatar('users/user-123/avatar.png');

      expect(getFile).toHaveBeenCalledWith('users/user-123/avatar.png');
      expect(result).toBe(dataUrl);
    });

    test('rejects paths outside the users/ prefix', async () => {
      await expect(getAvatar('reports/1.pdf')).rejects.toThrow('FORBIDDEN');

      expect(getFile).not.toHaveBeenCalled();
    });
  });

  describe('uploadAvatar', () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const pathname = 'users/user-123/avatar-xyz.png';

    test('uploads avatar and updates the user record', async () => {
      vi.mocked(uploadFile).mockResolvedValue({ pathname } as Awaited<
        ReturnType<typeof uploadFile>
      >);
      vi.mocked(updateUser).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await uploadAvatar(MOCK_USER.id, null, file);

      expect(uploadFile).toHaveBeenCalledWith('users/' + MOCK_USER.id, file, {
        contentType: file.type,
      });
      expect(updateUser).toHaveBeenCalledWith(MOCK_USER.id, {
        image: pathname,
      });
      expect(deleteFile).not.toHaveBeenCalled();
      expect(revalidate.user).toHaveBeenCalledWith(MOCK_USER.id);
      expect(result).toEqual({
        success: true,
        message: 'Uploaded avatar successfully',
        data: { image: pathname },
      });
    });

    test('forbids uploading an avatar for another user', async () => {
      await expect(
        uploadAvatar('someone-elses-id', null, file),
      ).rejects.toThrow('FORBIDDEN');

      expect(uploadFile).not.toHaveBeenCalled();
    });

    test('deletes the old avatar when it is the one on record', async () => {
      const oldPath = 'users/user-123-old-avatar.png';
      vi.mocked(selectUserById).mockResolvedValue({
        ...MOCK_USER,
        image: oldPath,
      });
      vi.mocked(uploadFile).mockResolvedValue({ pathname } as Awaited<
        ReturnType<typeof uploadFile>
      >);
      vi.mocked(updateUser).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      await uploadAvatar(MOCK_USER.id, oldPath, file);

      expect(deleteFile).toHaveBeenCalledWith(oldPath);
    });

    test('forbids deleting a blob the user does not own', async () => {
      // `users/user-123` is a prefix of another user's key, but not the record
      vi.mocked(selectUserById).mockResolvedValue({
        ...MOCK_USER,
        image: 'users/user-123-own.png',
      });

      await expect(
        uploadAvatar(MOCK_USER.id, 'users/user-1234-other.png', file),
      ).rejects.toThrow();

      expect(uploadFile).not.toHaveBeenCalled();
      expect(deleteFile).not.toHaveBeenCalled();
    });

    test('returns error when upload fails', async () => {
      vi.mocked(uploadFile).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await uploadAvatar(MOCK_USER.id, null, file);

      expect(updateUser).not.toHaveBeenCalled();
      expect(revalidate.user).not.toHaveBeenCalled();
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
      vi.mocked(updateUser).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await updatePersonalInfo(MOCK_USER.id, personalInfoData);

      expect(updateUser).toHaveBeenCalledWith(MOCK_USER.id, personalInfoData);
      expect(revalidate.user).toHaveBeenCalledWith(MOCK_USER.id);
      expect(result).toEqual({
        success: true,
        message: 'Updated personal information successfully',
      });
    });

    test('returns error when update fails', async () => {
      vi.mocked(updateUser).mockRejectedValue(new Error(errorMessage));

      const result = await updatePersonalInfo(MOCK_USER.id, personalInfoData);

      expect(result.success).toBe(false);
      expect(revalidate.user).not.toHaveBeenCalled();
    });

    test('forbids a non-admin from editing another user’s personal info', async () => {
      await expect(
        updatePersonalInfo('someone-elses-id', personalInfoData),
      ).rejects.toThrow('FORBIDDEN');

      expect(updateUser).not.toHaveBeenCalled();
    });

    test('allows an admin to edit another user’s personal info', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.SUPER_ADMIN });
      vi.mocked(updateUser).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await updatePersonalInfo(
        'someone-elses-id',
        personalInfoData,
      );

      expect(result.success).toBe(true);

      resetMockAuthUser();
    });
  });

  describe('updateTeamInfo', () => {
    const teamInfoData: EditTeamInfoValues = {
      user: {
        role: MOCK_USER.role as EditTeamInfoValues['user']['role'],
        state: MOCK_USER.state,
        join_date: MOCK_USER.join_date ?? null,
      },
      player: {
        jersey_number: MOCK_PLAYER.jersey_number,
        position: MOCK_PLAYER.position,
      },
      coach: {
        position: MOCK_COACH.position,
      },
    };

    // Editing another user (and changing roles) is an admin-only path
    const asAdmin = () =>
      setMockAuthUser({ ...MOCK_USER, role: UserRole.SUPER_ADMIN });

    beforeEach(() => {
      vi.mocked(isJerseyNumberTaken).mockResolvedValue(false);
      // The edited user currently holds the role being submitted
      vi.mocked(selectUserById).mockResolvedValue(MOCK_USER_WITH_PLAYER);
    });

    afterEach(() => {
      resetMockAuthUser();
    });

    test('forbids a non-admin from editing another user', async () => {
      await expect(
        updateTeamInfo('someone-else', teamInfoData),
      ).rejects.toThrow();

      expect(updateUserTeamInfo).not.toHaveBeenCalled();
    });

    test('forbids a non-admin from changing their own role', async () => {
      const escalation: EditTeamInfoValues = {
        ...teamInfoData,
        user: { ...teamInfoData.user, role: UserRole.COACH },
      };

      await expect(updateTeamInfo(MOCK_USER.id, escalation)).rejects.toThrow();

      expect(updateUserTeamInfo).not.toHaveBeenCalled();
    });

    test('leaves the membership untouched when join_date is not provided', async () => {
      asAdmin();

      await updateTeamInfo(MOCK_PLAYER.id, {
        ...teamInfoData,
        user: { ...teamInfoData.user, join_date: null },
      });

      expect(updateUserTeamInfo).toHaveBeenCalledWith(
        MOCK_PLAYER.id,
        expect.objectContaining({ membership: undefined }),
      );
    });

    test('updates team info for player successfully', async () => {
      asAdmin();

      const result = await updateTeamInfo(MOCK_PLAYER.id, teamInfoData);

      // Role unchanged, so nothing is removed
      expect(updateUserTeamInfo).toHaveBeenCalledWith(MOCK_PLAYER.id, {
        user: {
          role: teamInfoData.user.role,
          state: teamInfoData.user.state,
        },
        membership: { join_date: teamInfoData.user.join_date },
        player: teamInfoData.player,
        coach: undefined,
        remove: { player: false, coach: false },
      });
      expect(revalidate.user).toHaveBeenCalledWith(MOCK_PLAYER.id);
      expect(result).toEqual({
        success: true,
        message: 'Updated team information successfully',
      });
    });

    test('updates team info for coach successfully', async () => {
      asAdmin();
      const coachInfoData: EditTeamInfoValues = {
        ...teamInfoData,
        user: {
          ...teamInfoData.user,
          role: UserRole.COACH,
        },
      };
      vi.mocked(selectUserById).mockResolvedValue({
        ...MOCK_USER_WITH_COACH,
        role: UserRole.COACH,
      });

      const result = await updateTeamInfo(MOCK_COACH.id, coachInfoData);

      expect(updateUserTeamInfo).toHaveBeenCalledWith(MOCK_COACH.id, {
        user: {
          role: coachInfoData.user.role,
          state: coachInfoData.user.state,
        },
        membership: { join_date: coachInfoData.user.join_date },
        player: undefined,
        coach: coachInfoData.coach,
        remove: { player: false, coach: false },
      });
      expect(revalidate.user).toHaveBeenCalledWith(MOCK_COACH.id);
      expect(result).toEqual({
        success: true,
        message: 'Updated team information successfully',
      });
    });

    test('switches a player to coach, creating the coach and removing the player', async () => {
      asAdmin();
      const user = { ...teamInfoData.user, role: UserRole.COACH };

      const result = await updateTeamInfo(MOCK_PLAYER.id, {
        ...teamInfoData,
        user,
      });

      const { join_date, ...columns } = user;

      expect(selectUserById).toHaveBeenCalledWith(MOCK_PLAYER.id);
      expect(updateUserTeamInfo).toHaveBeenCalledWith(MOCK_PLAYER.id, {
        user: columns,
        membership: { join_date },
        player: undefined,
        coach: teamInfoData.coach,
        remove: { player: true, coach: false },
      });
      expect(result.success).toBe(true);
    });

    test('switches a coach to player, creating the player and removing the coach', async () => {
      asAdmin();
      vi.mocked(selectUserById).mockResolvedValue({
        ...MOCK_USER_WITH_COACH,
        role: UserRole.COACH,
      });

      const result = await updateTeamInfo(MOCK_COACH.id, teamInfoData);

      const { join_date, ...columns } = teamInfoData.user;
      expect(updateUserTeamInfo).toHaveBeenCalledWith(MOCK_COACH.id, {
        user: columns,
        membership: { join_date },
        player: teamInfoData.player,
        coach: undefined,
        remove: { player: false, coach: true },
      });
      expect(result.success).toBe(true);
    });

    test('removes the previous row when switching to a role without one', async () => {
      asAdmin();
      const user = { ...teamInfoData.user, role: UserRole.GUEST };

      const result = await updateTeamInfo(MOCK_PLAYER.id, {
        ...teamInfoData,
        user,
      });

      const { join_date, ...columns } = user;

      expect(updateUserTeamInfo).toHaveBeenCalledWith(MOCK_PLAYER.id, {
        user: columns,
        membership: { join_date },
        player: undefined,
        coach: undefined,
        remove: { player: true, coach: false },
      });
      expect(result.success).toBe(true);
    });

    test('throws not found when the user does not exist', async () => {
      asAdmin();
      vi.mocked(selectUserById).mockResolvedValue(null);

      await expect(
        updateTeamInfo(MOCK_PLAYER.id, teamInfoData),
      ).rejects.toThrow();

      expect(updateUserTeamInfo).not.toHaveBeenCalled();
    });

    test('rejects a jersey number already worn on the same team', async () => {
      vi.mocked(isJerseyNumberTaken).mockResolvedValue(true);

      const result = await updateTeamInfo(MOCK_USER.id, teamInfoData);

      // Scoped to the editor's team, and the player being edited is exempt
      expect(isJerseyNumberTaken).toHaveBeenCalledWith(
        MOCK_USER.team_id,
        MOCK_PLAYER.jersey_number,
        MOCK_USER.id,
      );
      // Nothing is written when the number clashes
      expect(updateUserTeamInfo).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: "Jersey number '9' is already taken",
      });
    });

    test('skips the jersey check when the player has no number', async () => {
      asAdmin();

      const result = await updateTeamInfo(MOCK_PLAYER.id, {
        ...teamInfoData,
        player: { ...teamInfoData.player, jersey_number: null },
      });

      expect(isJerseyNumberTaken).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('returns error response when the transaction fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateUserTeamInfo).mockRejectedValueOnce(
        new Error(errorMessage),
      );
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
      vi.mocked(deleteUser).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeUser(MOCK_USER.id);

      expect(deleteUser).toHaveBeenCalledWith(MOCK_USER.id);
      expect(revalidate.roster).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
    });

    test('returns error when delete fails', async () => {
      vi.mocked(deleteUser).mockRejectedValue(new Error('Delete failed'));

      const result = await removeUser(MOCK_USER.id);

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete user',
      });
    });
  });
});
