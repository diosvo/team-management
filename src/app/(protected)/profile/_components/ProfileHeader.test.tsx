import { PlayerPosition, UserRole, UserState } from '@/utils/enum';

import type { User } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';
import { useSessionContext } from '@/providers/session';
import {
  MOCK_PLAYER,
  MOCK_SESSION_USER,
  MOCK_USER,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';
import {
  createPermissionsMock,
  createSessionMock,
  enumText,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import ProfileHeader from './ProfileHeader';

vi.mock('./AvatarUploader', () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock('@/providers/session', () => ({ useSessionContext: vi.fn() }));

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

const PLAYER: User = {
  ...MOCK_USER_WITH_PLAYER,
  player: { ...MOCK_PLAYER, jersey_number: 7, is_captain: true },
};

describe('ProfileHeader', () => {
  setupTestLifecycle();

  const setup = (
    user: User = PLAYER,
    {
      viewOnly = false,
      viewerId = user.id,
      isAdmin = false,
    }: Partial<{ viewOnly: boolean; viewerId: string; isAdmin: boolean }> = {},
    locale?: 'en' | 'vi',
  ) => {
    vi.mocked(useSessionContext).mockReturnValue(
      createSessionMock({ user: { ...MOCK_SESSION_USER, id: viewerId } }),
    );
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsMock({ isAdmin }),
    );
    return renderWithUI(<ProfileHeader user={user} viewOnly={viewOnly} />, {
      locale,
    });
  };

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('shows the name, role, position and status', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: PLAYER.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enumText('userRole', 'player')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enumText('playerPosition', MOCK_PLAYER.position)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enumText('userState', UserState.ACTIVE)),
    ).toBeInTheDocument();
  });

  test('marks the team captain', () => {
    setup();

    expect(screen.getByText('Captain')).toBeInTheDocument();
  });

  test('shows the jersey as a badge on phones and a large number from md', () => {
    setup();

    // Both render in jsdom; CSS picks one per breakpoint.
    expect(screen.getByText('#7')).toBeInTheDocument();
    // The large number styles "#" and the digits apart, under a caption.
    const caption = screen.getByText('Jersey Number');
    expect(caption.nextElementSibling).toHaveTextContent(/^#7$/);
  });

  test('still links a player without a jersey to their performance', () => {
    setup({ ...PLAYER, player: { ...PLAYER.player!, jersey_number: null } });

    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    expect(screen.queryByText('Jersey Number')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view performance/i }),
    ).toBeInTheDocument();
  });

  test('shows only the role for an admin profile', () => {
    setup({ ...MOCK_USER, role: UserRole.SUPER_ADMIN });

    expect(
      screen.getByText(enumText('userRole', UserRole.SUPER_ADMIN)),
    ).toBeInTheDocument();
    // No position, jersey, captain badge or performance link.
    expect(
      screen.queryByText(enumText('playerPosition', PlayerPosition.UNKNOWN)),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    expect(screen.queryByText('Captain')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('omits the membership line without a join date', () => {
    setup({ ...PLAYER, join_date: null });

    expect(screen.queryByText(/^Joined for/)).not.toBeInTheDocument();
  });

  test('shows no jersey for a coach', () => {
    setup({ ...MOCK_USER_WITH_COACH, role: UserRole.COACH });

    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    expect(screen.getByText('Head')).toBeInTheDocument();
  });

  test('says how long the member has been with the team', () => {
    setup();

    // The date itself lives on the Team card.
    expect(screen.getByText(/^Joined for .+ years?$/)).toBeInTheDocument();
  });

  test('flags a read-only profile', () => {
    setup(PLAYER, { viewOnly: true });

    expect(screen.getByText('View Only')).toBeInTheDocument();
  });

  test.each([
    ['the player themselves', PLAYER.id, false, true],
    ['an admin', 'admin-1', true, true],
    ['a teammate', 'user-999', false, false],
  ])('links %s to the performance page: %s', (_, viewerId, isAdmin, shown) => {
    setup(PLAYER, { viewerId, isAdmin });

    const link = screen.queryByRole('link', { name: /view performance/i });
    if (shown) {
      expect(link).toHaveAttribute('href', `/performance/${PLAYER.id}`);
    } else {
      expect(link).not.toBeInTheDocument();
    }
  });

  test('offers no performance link on a coach profile', () => {
    setup({ ...MOCK_USER_WITH_COACH, role: UserRole.COACH }, { isAdmin: true });

    expect(
      screen.queryByRole('link', { name: /view performance/i }),
    ).not.toBeInTheDocument();
  });

  test('falls back to an unknown position', () => {
    setup({
      ...PLAYER,
      player: { ...PLAYER.player!, position: null },
    });

    expect(
      screen.getByText(enumText('playerPosition', PlayerPosition.UNKNOWN)),
    ).toBeInTheDocument();
  });

  test('follows the language toggle', () => {
    setup(PLAYER, {}, 'vi');

    expect(screen.getByText('Đội trưởng')).toBeInTheDocument();
    expect(screen.getByText(/^Đã gắn bó .+ năm$/)).toBeInTheDocument();
  });
});
