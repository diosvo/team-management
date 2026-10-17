import {
  MOCK_COACH,
  MOCK_PLAYER,
  MOCK_USER,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';
import {
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  within,
  enumText,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { UserRole, UserState } from '@/utils/enum';

import { removeUser } from '@/actions/user';
import type { RosterUser } from '@/db/user';

import RosterTable from './RosterTable';

const mockReplace = vi.fn();

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: () => ({ replace: mockReplace }),
  };
});

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/user', () => ({
  removeUser: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

const ALICE: RosterUser = {
  ...MOCK_USER_WITH_PLAYER,
  id: 'alice',
  name: 'Alice',
  email: 'alice@team.com',
  role: UserRole.PLAYER,
  state: UserState.ACTIVE,
};

const BOB: RosterUser = {
  ...MOCK_USER_WITH_COACH,
  id: 'bob',
  name: 'Bob',
  email: 'bob@team.com',
  role: UserRole.COACH,
  state: UserState.INACTIVE,
};

const CAROL: RosterUser = {
  ...MOCK_USER,
  id: 'carol',
  name: 'Carol',
  email: 'carol@team.com',
  role: UserRole.GUEST,
  state: UserState.ACTIVE,
};

describe('RosterTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveUser = vi.mocked(removeUser);

  const setup = ({
    users = [ALICE, BOB],
    perms = {},
    params = {},
  }: {
    users?: Array<RosterUser>;
    perms?: Record<string, boolean>;
    params?: Record<string, unknown>;
  } = {}) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({
        isAdmin: false,
        isCaptain: false,
        isGuest: false,
        ...perms,
      }),
    );
    mockUseQueryStates({ page: 1, q: '', role: [], state: [], ...params });

    return renderWithUI(<RosterTable users={users} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each user', () => {
    setup();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('alice@team.com')).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['No.', 'Name', 'Email', 'State', 'Roles', 'Position'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  describe('position', () => {
    test("shows a player's player position", () => {
      setup({ users: [ALICE] });

      expect(
        screen.getByText(enumText('playerPosition', MOCK_PLAYER.position)),
      ).toBeInTheDocument();
    });

    test("shows a coach's coach position", () => {
      setup({ users: [BOB] });

      expect(
        screen.getByText(enumText('coachPosition', MOCK_COACH.position)),
      ).toBeInTheDocument();
    });

    test('picks the position matching the role, not whichever record exists', () => {
      // A user switched from player to coach may still carry a player record.
      setup({ users: [{ ...BOB, player: MOCK_PLAYER }] });

      expect(
        screen.getByText(enumText('coachPosition', MOCK_COACH.position)),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(enumText('playerPosition', MOCK_PLAYER.position)),
      ).not.toBeInTheDocument();
    });

    test('shows a dash for roles without a position', () => {
      setup({ users: [CAROL] });

      const [, row] = screen.getAllByRole('row');
      const cells = within(row).getAllByRole('cell');
      expect(cells.at(-1)).toHaveTextContent('-');
    });
  });

  test('shows the empty state when there are no users', () => {
    setup({ users: [] });

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  test('filters users by the search query', () => {
    setup({ params: { q: 'alice' } });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  test('filters users by state', () => {
    setup({ params: { state: [UserState.ACTIVE] } });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  test('filters users by role', () => {
    setup({ params: { role: [UserRole.COACH] } });

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  test('masks names and emails for guests', () => {
    setup({ perms: { isGuest: true } });

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('alice@team.com')).not.toBeInTheDocument();
  });

  test('navigates to the profile when a row is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Alice'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/profile/alice');
    });
  });

  test('does not navigate when a guest clicks a row', async () => {
    const { user } = setup({ perms: { isGuest: true } });

    // Row 0 is the header; the first data row follows.
    const [, firstRow] = screen.getAllByRole('row');
    await user.click(firstRow);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  describe('selection', () => {
    test('deletes the selected users and reports success', async () => {
      mockRemoveUser.mockResolvedValue({ success: true, message: '' });

      const { user } = setup({ perms: { isAdmin: true } });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /Delete/ }));

      await waitFor(() => {
        const ids = mockRemoveUser.mock.calls.map(([id]) => id);
        expect(ids).toEqual(expect.arrayContaining(['alice', 'bob']));
      });

      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveUser
        .mockResolvedValueOnce({ success: true, message: '' })
        .mockResolvedValueOnce({ success: false, message: '' });

      const { user } = setup({ perms: { isAdmin: true } });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /Delete/ }));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith(
          'toast-id',
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });
});
