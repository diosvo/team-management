import { MOCK_SESSION_USER } from '@/test/mocks/user';
import {
  authCallbacks,
  createSessionMock,
  createSWRMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { useUserAvatar } from '@/hooks/use-image';
import authClient from '@/lib/auth-client';
import { useSessionContext, type SessionUser } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';

import AccountMenu from './AccountMenu';

const mockReplace = vi.fn();

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return { ...actual, useRouter: () => ({ replace: mockReplace }) };
});

vi.mock('@/providers/session', () => ({ useSessionContext: vi.fn() }));

vi.mock('@/hooks/use-image', () => ({ useUserAvatar: vi.fn() }));

vi.mock('@/lib/auth-client', () => ({
  default: { signOut: vi.fn() },
}));

describe('AccountMenu', () => {
  setupTestLifecycle();

  const mockUseSessionContext = vi.mocked(useSessionContext);
  const mockUseUserAvatar = vi.mocked(useUserAvatar);
  const mockSignOut = vi.mocked(authClient.signOut);

  const setup = (user: Nullable<SessionUser> = MOCK_SESSION_USER) => {
    mockUseSessionContext.mockReturnValue(createSessionMock({ user }));
    mockUseUserAvatar.mockReturnValue(
      createSWRMock<Nullable<string>>({ data: null }),
    );
    return renderWithUI(<AccountMenu />);
  };

  const openMenu = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button'));
  };

  test('should be accessible', async () => {
    const { user } = setup();
    await openMenu(user);

    await expectNoA11yViolations();
  });

  test('renders nothing when there is no authenticated user', () => {
    const { container } = setup(null);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders the avatar trigger when a user is authenticated', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  test('shows Profile and My Performance links when the menu is open', async () => {
    const { user } = setup();

    await openMenu(user);

    expect(
      await screen.findByRole('menuitem', { name: /profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /my performance/i }),
    ).toBeInTheDocument();
  });

  test('Profile link points to the user profile page', async () => {
    const { user } = setup();

    await openMenu(user);

    const profileItem = await screen.findByRole('menuitem', {
      name: /profile/i,
    });
    expect(profileItem).toHaveAttribute(
      'href',
      `/profile/${MOCK_SESSION_USER.id}`,
    );
  });

  test('My Performance link points to the user performance page', async () => {
    const { user } = setup();

    await openMenu(user);

    const perfItem = await screen.findByRole('menuitem', {
      name: /my performance/i,
    });
    expect(perfItem).toHaveAttribute(
      'href',
      `/performance/${MOCK_SESSION_USER.id}`,
    );
  });

  test('shows a Logout option when the menu is open', async () => {
    const { user } = setup();

    await openMenu(user);

    expect(await screen.findByText(/logout/i)).toBeInTheDocument();
  });

  test('calls signOut and redirects to login when Logout is clicked', async () => {
    mockSignOut.mockImplementation(async (options) => {
      const { fetchOptions } = (options ?? {}) as { fetchOptions?: unknown };
      authCallbacks(fetchOptions).onSuccess?.();
    });
    const { user } = setup();

    await openMenu(user);
    await user.click(await screen.findByText(/logout/i));

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(LOGIN_PATH);
  });
});
