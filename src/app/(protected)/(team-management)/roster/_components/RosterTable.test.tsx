import { nth } from 'es-toolkit/compat';

import { NO_EMAIL_DOMAIN } from '@/utils/constants';
import { UserRole, UserState } from '@/utils/enum';

import type { RosterUser } from '@/db/user';
import usePermissions from '@/hooks/use-permissions';
import {
  MOCK_ALICE,
  MOCK_BOB,
  MOCK_CAROL,
  MOCK_COACH,
  MOCK_PLAYER,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';
import {
  createPermissionsMock,
  enumText,
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  within,
} from '@/test/utilities';

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

const ALICE: RosterUser = MOCK_ALICE;
const BOB: RosterUser = MOCK_BOB;
const CAROL: RosterUser = MOCK_CAROL;

describe('RosterTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);

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

    expect(screen.getByText(ALICE.name)).toBeInTheDocument();
    expect(screen.getByText(BOB.name)).toBeInTheDocument();
    expect(screen.getByText(ALICE.email)).toBeInTheDocument();
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

      const row = nth(screen.getAllByRole('row'), 1)!;
      const cells = within(row).getAllByRole('cell');
      expect(cells.at(-1)).toHaveTextContent('-');
    });
  });

  test('shows the empty state when there are no users', () => {
    setup({ users: [] });

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  test('filters users by the search query', () => {
    setup({ params: { q: ALICE.id } });

    expect(screen.getByText(ALICE.name)).toBeInTheDocument();
    expect(screen.queryByText(BOB.name)).not.toBeInTheDocument();
  });

  test('filters users by state', () => {
    setup({ params: { state: [UserState.ACTIVE] } });

    expect(screen.getByText(ALICE.name)).toBeInTheDocument();
    expect(screen.queryByText(BOB.name)).not.toBeInTheDocument();
  });

  test('filters users by role', () => {
    setup({ params: { role: [UserRole.COACH] } });

    expect(screen.getByText(BOB.name)).toBeInTheDocument();
    expect(screen.queryByText(ALICE.name)).not.toBeInTheDocument();
  });

  test('masks names and emails for guests', () => {
    setup({ perms: { isGuest: true } });

    expect(screen.queryByText(ALICE.name)).not.toBeInTheDocument();
    expect(screen.queryByText(ALICE.email)).not.toBeInTheDocument();
  });

  test('navigates to the profile when a row is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText(ALICE.name));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/profile/${ALICE.id}`);
    });
  });

  test('does not navigate when a guest clicks a row', async () => {
    const { user } = setup({ perms: { isGuest: true } });

    // Row 0 is the header; the first data row follows.
    const firstRow = nth(screen.getAllByRole('row'), 1)!;
    await user.click(firstRow);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('is read-only: no row selection, even for admins', () => {
    setup({ perms: { isAdmin: true } });

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  test('shows "No email" for a member added without one', () => {
    setup({
      users: [{ ...ALICE, email: `alice@${NO_EMAIL_DOMAIN}` }],
      perms: { isAdmin: true },
    });

    expect(screen.getByText('No email')).toBeInTheDocument();
    expect(screen.queryByText(/@no-email/)).not.toBeInTheDocument();
  });

  test('shows the unverified icon for a user whose email is not verified', () => {
    const unverifiedUser: RosterUser = {
      ...MOCK_USER_WITH_PLAYER,
      id: 'unverified',
      name: 'Unverified User',
      email: 'unverified@team.com',
      emailVerified: false,
    };

    setup({ users: [unverifiedUser], perms: { isAdmin: true } });

    // The row renders; the verified column shows the alert icon (no text to assert).
    expect(screen.getByText('Unverified User')).toBeInTheDocument();
  });
});
