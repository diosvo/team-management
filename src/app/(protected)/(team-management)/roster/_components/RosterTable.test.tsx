import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { toaster } from '@/components/ui/toaster';

import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { UserRole, UserState } from '@/utils/enum';

import { removeUser } from '@/actions/user';
import { User } from '@/drizzle/schema/user';

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

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}));

const ALICE: User = {
  ...MOCK_USER,
  id: 'alice',
  name: 'Alice',
  email: 'alice@team.com',
  role: UserRole.PLAYER,
  state: UserState.ACTIVE,
};

const BOB: User = {
  ...MOCK_USER,
  id: 'bob',
  name: 'Bob',
  email: 'bob@team.com',
  role: UserRole.COACH,
  state: UserState.INACTIVE,
};

describe('RosterTable', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockRemoveUser = removeUser as unknown as Mock;

  const setup = (
    {
      users = [ALICE, BOB],
      perms = {},
      params = {},
    }: {
      users?: Array<User>;
      perms?: Record<string, boolean>;
      params?: Record<string, unknown>;
    } = {},
  ) => {
    mockUsePermissions.mockReturnValue({
      isAdmin: false,
      isCaptain: false,
      isGuest: false,
      ...perms,
    });
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { page: 1, q: '', role: [], state: [], ...params },
      vi.fn(),
    ]);

    return renderWithUI(<RosterTable users={users} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
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
      mockRemoveUser.mockResolvedValue({ success: true });

      const { user } = setup({ perms: { isAdmin: true } });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /Delete/ }));

      await waitFor(() => {
        const ids = mockRemoveUser.mock.calls.map(([id]) => id);
        expect(ids).toEqual(expect.arrayContaining(['alice', 'bob']));
      });

      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveUser
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false });

      const { user } = setup({ perms: { isAdmin: true } });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /Delete/ }));

      await waitFor(() => {
        expect(toaster.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });
});
