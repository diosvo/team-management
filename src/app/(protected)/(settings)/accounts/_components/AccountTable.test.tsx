import { NO_EMAIL_DOMAIN } from '@/utils/constants';
import { formatDatetime } from '@/utils/datetime';
import { AccountStatus } from '@/utils/enum';

import {
  removeAccount,
  removeSessions,
  sendPasswordLink,
} from '@/actions/account';
import type { Account } from '@/db/account';
import usePermissions, {
  type PermissionsResult,
} from '@/hooks/use-permissions';
import { useSessionContext } from '@/providers/session';
import {
  MOCK_ACCOUNT,
  MOCK_EXPIRED_ACCOUNT,
  MOCK_INVITED_ACCOUNT,
  MOCK_OWN_ACCOUNT,
} from '@/test/mocks/account';
import { MOCK_SESSION_USER } from '@/test/mocks/user';
import {
  createPermissionsMock,
  createSessionMock,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  within,
} from '@/test/utilities';

import AccountTable from './AccountTable';
import { UpdateAccount } from './UpdateAccount';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/providers/session', () => ({
  useSessionContext: vi.fn(),
}));

vi.mock('@/actions/account', () => ({
  removeAccount: vi.fn(),
  removeSessions: vi.fn(),
  sendPasswordLink: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpdateAccount', () => ({
  UpdateAccount: { open: vi.fn(), Viewport: () => null },
}));

const ACCOUNTS = [
  MOCK_OWN_ACCOUNT,
  MOCK_ACCOUNT,
  MOCK_INVITED_ACCOUNT,
  MOCK_EXPIRED_ACCOUNT,
];

const ADMIN: PermissionsResult['can'] = () => true;

describe('AccountTable', () => {
  const setup = ({
    accounts = ACCOUNTS,
    can = ADMIN,
    params = {},
    signedIn = true,
  }: Partial<{
    accounts: Array<Account>;
    can: PermissionsResult['can'];
    params: Record<string, unknown>;
    signedIn: boolean;
  }> = {}) => {
    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock({ can }));
    vi.mocked(useSessionContext).mockReturnValue(
      createSessionMock({ user: signedIn ? MOCK_SESSION_USER : null }),
    );
    mockUseQueryStates({ page: 1, q: '', status: [], ...params });

    return renderWithUI(<AccountTable accounts={accounts} />);
  };

  const rowOf = (name: string) => screen.getByText(name).closest('tr')!;

  /** The bulk action in the selection bar, not a per-row icon button. */
  const bulkButton = (name: string) =>
    screen.getAllByRole('button', { name }).find((el) => !el.closest('tr'))!;

  const NO_EMAIL_ACCOUNT: Account = {
    ...MOCK_EXPIRED_ACCOUNT,
    id: 'user-000',
    name: 'Tuan Do',
    email: `tuan@${NO_EMAIL_DOMAIN}`,
    status: AccountStatus.NO_EMAIL,
    link_expires_at: null,
  };

  const selectRow = async (
    user: ReturnType<typeof setup>['user'],
    name: string,
  ) => user.click(within(rowOf(name)).getByRole('checkbox'));

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the column headers', () => {
    setup();

    [
      'Name',
      'Email',
      'Role',
      'Status',
      'Sessions',
      'Last sign-in',
      'IP address',
      'Added',
      'Actions',
    ].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('shows each account with its status, sessions and activity', () => {
    setup();

    const row = within(rowOf(MOCK_ACCOUNT.name));
    expect(row.getByText(MOCK_ACCOUNT.email)).toBeInTheDocument();
    expect(row.getByText('Player')).toBeInTheDocument();
    expect(row.getByText('Activated')).toBeInTheDocument();
    expect(row.getByText('2')).toBeInTheDocument();
    expect(
      row.getByText(formatDatetime(MOCK_ACCOUNT.last_sign_in_at)),
    ).toBeInTheDocument();
    expect(row.getByText('203.0.113.7')).toBeInTheDocument();
    expect(
      within(rowOf(MOCK_INVITED_ACCOUNT.name)).getByText('Invited'),
    ).toBeInTheDocument();
    expect(
      within(rowOf(MOCK_EXPIRED_ACCOUNT.name)).getByText('Link expired'),
    ).toBeInTheDocument();
  });

  test('shows a dash for a member who never signed in', () => {
    setup({ accounts: [MOCK_INVITED_ACCOUNT] });

    expect(
      within(rowOf(MOCK_INVITED_ACCOUNT.name)).getAllByText('-').length,
    ).toBeGreaterThan(0);
  });

  test('shows "No email" instead of a placeholder address', () => {
    setup({ accounts: [NO_EMAIL_ACCOUNT] });

    const row = within(rowOf(NO_EMAIL_ACCOUNT.name));
    expect(row.getAllByText('No email')).toHaveLength(2); // email + status
    expect(row.queryByText(NO_EMAIL_ACCOUNT.email)).not.toBeInTheDocument();
  });

  test("marks the admin's own row", () => {
    setup();

    expect(
      within(rowOf(MOCK_OWN_ACCOUNT.name)).getByText('You'),
    ).toBeInTheDocument();
    expect(
      within(rowOf(MOCK_ACCOUNT.name)).queryByText('You'),
    ).not.toBeInTheDocument();
  });

  test('links each row to the profile', () => {
    setup();

    expect(
      within(rowOf(MOCK_ACCOUNT.name)).getByRole('link', {
        name: 'View profile',
      }),
    ).toHaveAttribute('href', `/profile/${MOCK_ACCOUNT.id}`);
  });

  describe('status hint', () => {
    test.each([
      [
        'an invite',
        MOCK_INVITED_ACCOUNT,
        `Link expires ${formatDatetime(MOCK_INVITED_ACCOUNT.link_expires_at)}`,
      ],
      [
        'an expired link',
        MOCK_EXPIRED_ACCOUNT,
        `Link expired ${formatDatetime(MOCK_EXPIRED_ACCOUNT.link_expires_at)}`,
      ],
      [
        'a member never sent a link',
        { ...MOCK_EXPIRED_ACCOUNT, link_expires_at: null },
        'No link sent yet',
      ],
      [
        'a member without an email',
        NO_EMAIL_ACCOUNT,
        'Add their email to invite them',
      ],
    ])('explains %s on hover', async (_, account, hint) => {
      const { user } = setup({ accounts: [account] });
      const label = {
        [AccountStatus.INVITED]: 'Invited',
        [AccountStatus.LINK_EXPIRED]: 'Link expired',
        [AccountStatus.NO_EMAIL]: 'No email',
      }[
        account.status as Exclude<AccountStatus, typeof AccountStatus.ACTIVATED>
      ];

      await user.hover(
        within(rowOf(account.name))
          .getAllByText(label)
          .find((el) => el.closest('[data-scope="badge"], .chakra-badge'))!,
      );

      expect(await screen.findByText(hint)).toBeInTheDocument();
    });
  });

  test('filters by search query and status', () => {
    setup({ params: { q: 'minh', status: [AccountStatus.INVITED] } });

    expect(screen.getAllByRole('row')).toHaveLength(2); // header + match
    // HighlightText splits off the matched "minh"
    expect(screen.getByText('@example.com')).toBeInTheDocument();
    expect(screen.queryByText(MOCK_ACCOUNT.name)).not.toBeInTheDocument();
  });

  test('shows the empty state when nothing matches', () => {
    setup({ accounts: [] });

    expect(screen.getByText('No accounts found')).toBeInTheDocument();
  });

  test('opens the update dialog on row click for editors', async () => {
    const { user } = setup();

    await user.click(screen.getByText(MOCK_ACCOUNT.email));

    expect(UpdateAccount.open).toHaveBeenCalledWith('update-account', {
      account: MOCK_ACCOUNT,
    });
  });

  test('does nothing on row click without edit access', async () => {
    const { user } = setup({ can: () => false });

    await user.click(screen.getByText(MOCK_ACCOUNT.email));

    expect(UpdateAccount.open).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  describe('row sign-out', () => {
    const rowSignOut = (name: string) =>
      within(rowOf(name)).queryByRole('button', {
        name: 'Sign out everywhere',
      });

    test('shows only for other members with active sessions', () => {
      setup({
        accounts: [MOCK_OWN_ACCOUNT, MOCK_ACCOUNT, MOCK_INVITED_ACCOUNT],
      });

      expect(rowSignOut(MOCK_ACCOUNT.name)).toBeInTheDocument();
      expect(rowSignOut(MOCK_OWN_ACCOUNT.name)).not.toBeInTheDocument();
      expect(rowSignOut(MOCK_INVITED_ACCOUNT.name)).not.toBeInTheDocument();
    });

    test('is hidden without edit access', () => {
      setup({ can: () => false });

      expect(rowSignOut(MOCK_ACCOUNT.name)).not.toBeInTheDocument();
    });

    test.each([
      [true, 'success', `Signed ${MOCK_ACCOUNT.name} out of every device`],
      [false, 'error', 'Failed to sign out'],
    ])('signs one member out (success: %s)', async (success, type, message) => {
      vi.mocked(removeSessions).mockResolvedValue({ success, message });
      const { user } = setup();

      await user.click(rowSignOut(MOCK_ACCOUNT.name)!);

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type,
          title: message,
        });
      });
      expect(removeSessions).toHaveBeenCalledWith(MOCK_ACCOUNT.id);
      expect(mockToaster.create).toHaveBeenCalledWith({
        type: 'loading',
        title: 'Signing out...',
      });
    });
  });

  describe('selection', () => {
    test("can't select the admin's own row", () => {
      setup();

      expect(
        within(rowOf(MOCK_OWN_ACCOUNT.name)).getByRole('checkbox'),
      ).toBeDisabled();
      expect(
        within(rowOf(MOCK_ACCOUNT.name)).getByRole('checkbox'),
      ).toBeEnabled();
    });

    test('every row is selectable before the session loads', () => {
      setup({ signedIn: false });

      expect(
        within(rowOf(MOCK_OWN_ACCOUNT.name)).getByRole('checkbox'),
      ).toBeEnabled();
    });

    test("sends one member a link with the action's own message", async () => {
      vi.mocked(sendPasswordLink).mockResolvedValue({
        success: true,
        message: 'Sent a password link to minh@example.com',
      });
      const { user } = setup();

      await selectRow(user, MOCK_INVITED_ACCOUNT.name);
      await user.click(
        screen.getByRole('button', { name: 'Send password link' }),
      );

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'success',
          title: 'Sent a password link to minh@example.com',
        });
      });
      expect(sendPasswordLink).toHaveBeenCalledWith(MOCK_INVITED_ACCOUNT.id);
      expect(mockToaster.create).toHaveBeenCalledWith({
        type: 'loading',
        title: 'Sending password links...',
      });
    });

    test('counts members when several are signed out', async () => {
      vi.mocked(removeSessions).mockResolvedValue({
        success: true,
        message: 'Signed someone out of every device',
      });
      const { user } = setup();

      await selectRow(user, MOCK_ACCOUNT.name);
      await selectRow(user, MOCK_INVITED_ACCOUNT.name);
      await user.click(bulkButton('Sign out everywhere'));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'success',
          title: 'Signed 2 members out of every device',
        });
      });
      expect(removeSessions).toHaveBeenCalledTimes(2);
    });

    test('counts members when several get a link', async () => {
      vi.mocked(sendPasswordLink).mockResolvedValue({
        success: true,
        message: 'Sent',
      });
      const { user } = setup();

      await selectRow(user, MOCK_ACCOUNT.name);
      await selectRow(user, MOCK_EXPIRED_ACCOUNT.name);
      await user.click(
        screen.getByRole('button', { name: 'Send password link' }),
      );

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'success',
          title: 'Sent password links to 2 members',
        });
      });
    });

    test('reports the first failure and keeps the selection', async () => {
      vi.mocked(removeSessions)
        .mockResolvedValueOnce({ success: true, message: 'ok' })
        .mockResolvedValueOnce({
          success: false,
          message: 'Failed to sign out',
        });
      const { user } = setup();

      await selectRow(user, MOCK_ACCOUNT.name);
      await selectRow(user, MOCK_INVITED_ACCOUNT.name);
      await user.click(bulkButton('Sign out everywhere'));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
          type: 'error',
          title: 'Failed to sign out',
        });
      });
      expect(
        within(rowOf(MOCK_ACCOUNT.name)).getByRole('checkbox'),
      ).toBeChecked();
    });

    test('deletes the selected accounts', async () => {
      vi.mocked(removeAccount).mockResolvedValue({
        success: true,
        message: 'Deleted',
      });
      const { user } = setup();

      await selectRow(user, MOCK_ACCOUNT.name);
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(removeAccount).toHaveBeenCalledWith(MOCK_ACCOUNT.id);
      });
    });
  });
});
