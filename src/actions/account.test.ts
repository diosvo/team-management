import { ESTABLISHED_DATE, NO_EMAIL_DOMAIN } from '@/utils/constants';
import { CoachPosition, PlayerPosition, UserRole } from '@/utils/enum';

import { sendPasswordSetup } from '@/lib/password-setup';

import { revalidate } from '@/actions/cache';
import {
  deletePasswordLinks,
  deleteSessions,
  isHistoryRecorded,
  isPasswordSet,
  selectAccounts,
} from '@/db/account';
import { insertCoach } from '@/db/coach';
import { getDbErrorMessage, isUniqueViolation } from '@/db/pg-error';
import { insertPlayer } from '@/db/player';
import { deleteUser, selectUserById, updateUser } from '@/db/user';
import { insertMembership } from '@/db/user-team';
import type { AddUserValues } from '@/schemas/user';
import { MOCK_ACCOUNT } from '@/test/mocks/account';
import { mockWithResource, mockWithResourceAction } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_USER, MOCK_USER_INPUT } from '@/test/mocks/user';

import {
  createAccount,
  getAccounts,
  removeAccount,
  removeSessions,
  sendPasswordLink,
  updateAccount,
} from './account';

vi.mock('./auth', () => ({
  withResource: mockWithResource,
}));

vi.mock('@/db/account', () => ({
  deletePasswordLinks: vi.fn(),
  deleteSessions: vi.fn(),
  isHistoryRecorded: vi.fn(),
  isPasswordSet: vi.fn(),
  selectAccounts: vi.fn(),
}));

vi.mock('@/db/user', () => ({
  selectUserById: vi.fn(),
  updateUser: vi.fn(),
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
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
  isUniqueViolation: vi.fn(),
}));

vi.mock('@/lib/password-setup', () => ({
  sendPasswordSetup: vi.fn(),
}));

const { mockCreateAuthUser } = vi.hoisted(() => ({
  mockCreateAuthUser: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  default: {
    $context: Promise.resolve({
      internalAdapter: { createUser: mockCreateAuthUser },
    }),
  },
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    accounts: vi.fn(),
    roster: vi.fn(),
    user: vi.fn(),
  },
}));

/** Another member of the admin's team. */
const MEMBER = {
  ...MOCK_USER,
  id: MOCK_ACCOUNT.id,
  email: MOCK_ACCOUNT.email,
};

/** A member added without an email. */
const NO_EMAIL_MEMBER = {
  ...MEMBER,
  email: `placeholder@${NO_EMAIL_DOMAIN}`,
};

describe('permissions', () => {
  test('scopes every action to the accounts resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('accounts');
  });

  test.each([
    [['view'], 'list'],
    [['create'], 'invite'],
    [['edit'], 'update'],
    [['edit'], 'sendLink'],
    [['edit'], 'signOut'],
    [['delete'], 'remove'],
  ])('requires %j for %s', (actions, name) => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      actions,
      expect.objectContaining({ name }),
    );
  });
});

describe('Account actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectUserById).mockResolvedValue(MEMBER);
  });

  describe('getAccounts', () => {
    test("lists the accounts on the admin's team", async () => {
      vi.mocked(selectAccounts).mockResolvedValue([MOCK_ACCOUNT]);

      expect(await getAccounts()).toEqual([MOCK_ACCOUNT]);
      expect(selectAccounts).toHaveBeenCalledWith(MOCK_TEAM.team_id);
    });
  });

  describe('createAccount', () => {
    const newUser = {
      id: 'new-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      email: MOCK_USER.email,
      emailVerified: false,
      name: MOCK_USER.name,
      image: null,
    };
    const newPlayer: AddUserValues = {
      ...MOCK_USER_INPUT,
      role: UserRole.PLAYER,
      position: PlayerPosition.POINT_GUARD,
    };

    beforeEach(() => {
      mockCreateAuthUser.mockResolvedValue(newUser);
    });

    test('invites a player and opens their membership', async () => {
      const result = await createAccount(newPlayer);

      expect(insertPlayer).toHaveBeenCalledWith({
        id: 'new-user-id',
        position: PlayerPosition.POINT_GUARD,
      });
      expect(insertCoach).not.toHaveBeenCalled();
      expect(insertMembership).toHaveBeenCalledWith(
        'new-user-id',
        MOCK_TEAM.team_id,
        newPlayer.join_date,
      );
      expect(sendPasswordSetup).toHaveBeenCalledWith(MOCK_USER.email);
      expect(revalidate.roster).toHaveBeenCalled();
      expect(revalidate.accounts).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Sent an email with instructions',
      });
    });

    test('creates the user without a password or non-auth fields', async () => {
      await createAccount({ ...newPlayer, email: ' Dios@Example.COM ' });

      const created = mockCreateAuthUser.mock.calls.at(0)?.at(0);
      expect(created).toEqual({
        name: newPlayer.name,
        email: 'dios@example.com',
        role: newPlayer.role,
        state: newPlayer.state,
        team_id: MOCK_TEAM.team_id,
        emailVerified: false,
      });
      expect(created).not.toHaveProperty('password');
      expect(mockCreateAuthUser.mock.calls.at(0)?.at(1)).toEqual({
        method: 'admin',
      });
    });

    test('adds a member without an email under a placeholder', async () => {
      const result = await createAccount({ ...newPlayer, email: '  ' });

      expect(mockCreateAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringMatching(new RegExp(`@${NO_EMAIL_DOMAIN}$`)),
        }),
        { method: 'admin' },
      );
      expect(sendPasswordSetup).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: `Added ${newUser.name}. Add their email later to invite them.`,
      });
    });

    test('treats a missing email like a blank one', async () => {
      await createAccount({ ...newPlayer, email: undefined });

      expect(sendPasswordSetup).not.toHaveBeenCalled();
    });

    test('saves the date of birth separately', async () => {
      await createAccount({ ...newPlayer, dob: '2000-01-31' });

      expect(updateUser).toHaveBeenCalledWith('new-user-id', {
        dob: '2000-01-31',
      });
    });

    test('skips the date of birth when none is given', async () => {
      await createAccount({ ...newPlayer, dob: null });

      expect(updateUser).not.toHaveBeenCalled();
    });

    test('opens the membership from the club founding date when join_date is omitted', async () => {
      await createAccount({ ...newPlayer, join_date: undefined as never });

      expect(insertMembership).toHaveBeenCalledWith(
        'new-user-id',
        MOCK_TEAM.team_id,
        ESTABLISHED_DATE,
      );
    });

    test('adds a coach with their coaching position', async () => {
      const result = await createAccount({
        ...MOCK_USER_INPUT,
        role: UserRole.COACH,
        position: CoachPosition.HEAD_COACH,
      });

      expect(insertCoach).toHaveBeenCalledWith({
        id: 'new-user-id',
        position: CoachPosition.HEAD_COACH,
      });
      expect(insertPlayer).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('adds a guest without a player or coach row', async () => {
      await createAccount({ ...MOCK_USER_INPUT, role: UserRole.GUEST });

      expect(insertPlayer).not.toHaveBeenCalled();
      expect(insertCoach).not.toHaveBeenCalled();
    });

    test('reports a taken email in plain words', async () => {
      mockCreateAuthUser.mockRejectedValue(new Error('duplicate'));
      vi.mocked(isUniqueViolation).mockReturnValue(true);

      const result = await createAccount(newPlayer);

      expect(isUniqueViolation).toHaveBeenCalledWith(
        expect.any(Error),
        'user_email_unique',
      );
      expect(sendPasswordSetup).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'This email is already used by another account',
      });
    });

    test('returns the database message on other errors', async () => {
      mockCreateAuthUser.mockRejectedValue(new Error('boom'));
      vi.mocked(isUniqueViolation).mockReturnValue(false);
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Database error',
        constraint: null,
      });

      const result = await createAccount(newPlayer);

      expect(result).toEqual({ success: false, message: 'Database error' });
    });
  });

  describe('team scoping', () => {
    const runs = [
      ['updateAccount', () => updateAccount(MEMBER.id, MEMBER)],
      ['sendPasswordLink', () => sendPasswordLink(MEMBER.id)],
      ['removeSessions', () => removeSessions(MEMBER.id)],
      ['removeAccount', () => removeAccount(MEMBER.id)],
    ] as const;

    test.each(runs)('%s 404s for a missing member', async (_, run) => {
      vi.mocked(selectUserById).mockResolvedValue(null);

      await expect(run()).rejects.toThrow('NOT_FOUND');
    });

    test.each(runs)('%s 404s for a member of another team', async (_, run) => {
      vi.mocked(selectUserById).mockResolvedValue({
        ...MEMBER,
        team_id: 'other-team',
      });

      await expect(run()).rejects.toThrow('NOT_FOUND');
      expect(updateUser).not.toHaveBeenCalled();
      expect(deleteUser).not.toHaveBeenCalled();
      expect(deleteSessions).not.toHaveBeenCalled();
      expect(sendPasswordSetup).not.toHaveBeenCalled();
    });

    test.each([
      ['updateAccount', () => updateAccount(MOCK_USER.id, MOCK_USER)],
      ['sendPasswordLink', () => sendPasswordLink(MOCK_USER.id)],
      ['removeSessions', () => removeSessions(MOCK_USER.id)],
      ['removeAccount', () => removeAccount(MOCK_USER.id)],
    ] as const)('%s refuses the admin’s own account', async (_, run) => {
      await expect(run()).rejects.toThrow('FORBIDDEN');
      expect(selectUserById).not.toHaveBeenCalled();
    });
  });

  describe('updateAccount', () => {
    test('saves the name and keeps verification for the same email', async () => {
      const result = await updateAccount(MEMBER.id, {
        name: 'Linh Tran Updated',
        email: MEMBER.email.toUpperCase(),
      });

      expect(updateUser).toHaveBeenCalledWith(MEMBER.id, {
        name: 'Linh Tran Updated',
        email: MEMBER.email,
      });
      expect(deletePasswordLinks).not.toHaveBeenCalled();
      expect(revalidate.accounts).toHaveBeenCalled();
      expect(revalidate.roster).toHaveBeenCalled();
      expect(revalidate.user).toHaveBeenCalledWith(MEMBER.id);
      expect(result).toEqual({
        success: true,
        message: 'Updated account successfully',
      });
    });

    test.each([
      ['blank', '  '],
      ['missing', undefined],
    ])('refuses a %s email for a member who has one', async (_, email) => {
      const result = await updateAccount(MEMBER.id, {
        name: MEMBER.name,
        email,
      });

      expect(updateUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: "Enter an email: a member who has one can't go back to none.",
      });
    });

    test('keeps the placeholder when a no-email member stays blank', async () => {
      vi.mocked(selectUserById).mockResolvedValue(NO_EMAIL_MEMBER);

      const result = await updateAccount(MEMBER.id, {
        name: 'Renamed',
        email: '',
      });

      expect(updateUser).toHaveBeenCalledWith(MEMBER.id, {
        name: 'Renamed',
        email: NO_EMAIL_MEMBER.email,
      });
      expect(sendPasswordSetup).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('voids old links and only saves when a password is already set', async () => {
      vi.mocked(isPasswordSet).mockResolvedValue(true);

      const result = await updateAccount(MEMBER.id, {
        name: MEMBER.name,
        email: 'new@example.com',
      });

      expect(updateUser).toHaveBeenCalledWith(MEMBER.id, {
        name: MEMBER.name,
        email: 'new@example.com',
        emailVerified: false,
      });
      expect(deletePasswordLinks).toHaveBeenCalledWith(MEMBER.id);
      expect(sendPasswordSetup).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated account successfully',
      });
    });

    test('sends a fresh link to a new email until a password is set', async () => {
      vi.mocked(selectUserById).mockResolvedValue(NO_EMAIL_MEMBER);
      vi.mocked(isPasswordSet).mockResolvedValue(false);

      const result = await updateAccount(MEMBER.id, {
        name: MEMBER.name,
        email: 'new@example.com',
      });

      expect(sendPasswordSetup).toHaveBeenCalledWith('new@example.com');
      expect(result).toEqual({
        success: true,
        message: 'Sent a password link to new@example.com',
      });
    });

    test('reports a saved change whose link failed to send', async () => {
      vi.mocked(isPasswordSet).mockResolvedValue(false);
      vi.mocked(sendPasswordSetup).mockRejectedValueOnce(new Error('smtp'));

      const result = await updateAccount(MEMBER.id, {
        name: MEMBER.name,
        email: 'new@example.com',
      });

      expect(updateUser).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message:
          "Saved, but the email couldn't be sent. Try Send password link.",
      });
    });

    test('reports an email used by another account', async () => {
      vi.mocked(updateUser).mockRejectedValueOnce(new Error('duplicate'));
      vi.mocked(isUniqueViolation).mockReturnValue(true);

      const result = await updateAccount(MEMBER.id, {
        name: MEMBER.name,
        email: 'taken@example.com',
      });

      expect(isUniqueViolation).toHaveBeenCalledWith(
        expect.any(Error),
        'user_email_unique',
      );
      expect(result).toEqual({
        success: false,
        message: 'This email is already used by another account',
      });
    });

    test('returns the database message on other errors', async () => {
      vi.mocked(updateUser).mockRejectedValueOnce(new Error('boom'));
      vi.mocked(isUniqueViolation).mockReturnValue(false);
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Database error',
        constraint: null,
      });

      const result = await updateAccount(MEMBER.id, MEMBER);

      expect(result).toEqual({ success: false, message: 'Database error' });
      expect(revalidate.accounts).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordLink', () => {
    test("emails a link to the member's address", async () => {
      const result = await sendPasswordLink(MEMBER.id);

      expect(sendPasswordSetup).toHaveBeenCalledWith(MEMBER.email);
      expect(revalidate.accounts).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: `Sent a password link to ${MEMBER.email}`,
      });
    });

    test('refuses a member without an email', async () => {
      vi.mocked(selectUserById).mockResolvedValue(NO_EMAIL_MEMBER);

      const result = await sendPasswordLink(MEMBER.id);

      expect(sendPasswordSetup).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: `${MEMBER.name} has no email yet. Add one to send a link.`,
      });
    });

    test('reports a failed send', async () => {
      vi.mocked(sendPasswordSetup).mockRejectedValueOnce(new Error('smtp'));

      const result = await sendPasswordLink(MEMBER.id);

      expect(result).toEqual({
        success: false,
        message: 'Failed to send the email',
      });
    });
  });

  describe('removeSessions', () => {
    test("drops the member's sessions", async () => {
      const result = await removeSessions(MEMBER.id);

      expect(deleteSessions).toHaveBeenCalledWith(MEMBER.id);
      expect(revalidate.accounts).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: `Signed ${MEMBER.name} out of every device`,
      });
    });

    test('reports a failure', async () => {
      vi.mocked(deleteSessions).mockRejectedValueOnce(new Error('db'));

      const result = await removeSessions(MEMBER.id);

      expect(result).toEqual({ success: false, message: 'Failed to sign out' });
    });
  });

  describe('removeAccount', () => {
    test('deletes a member with no recorded history', async () => {
      vi.mocked(isHistoryRecorded).mockResolvedValue(false);

      const result = await removeAccount(MEMBER.id);

      expect(deleteUser).toHaveBeenCalledWith(MEMBER.id);
      expect(revalidate.accounts).toHaveBeenCalled();
      expect(revalidate.roster).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Account deleted successfully',
      });
    });

    test('keeps a member with recorded history', async () => {
      vi.mocked(isHistoryRecorded).mockResolvedValue(true);

      const result = await removeAccount(MEMBER.id);

      expect(isHistoryRecorded).toHaveBeenCalledWith(MEMBER.id);
      expect(deleteUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: `${MEMBER.name} has recorded history, so they can’t be deleted. Set them to Inactive on their profile instead.`,
      });
    });

    test('reports a failure', async () => {
      vi.mocked(isHistoryRecorded).mockResolvedValue(false);
      vi.mocked(deleteUser).mockRejectedValueOnce(new Error('db'));

      const result = await removeAccount(MEMBER.id);

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete account',
      });
    });
  });
});
