import { Mock } from 'vitest';

import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen } from '@/test/utilities';

import authClient from '@/lib/auth-client';
import { LOGIN_PATH } from '@/routes';

import AccountMenu from './AccountMenu';

const mockReplace = vi.fn();

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return { ...actual, useRouter: () => ({ replace: mockReplace }) };
});

vi.mock('@/lib/auth-client', () => ({
  default: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('AccountMenu', () => {
  const mockUseSession = authClient.useSession as unknown as Mock;
  const mockSignOut = authClient.signOut as unknown as Mock;

  const setup = (user: typeof MOCK_USER | null = MOCK_USER) => {
    mockUseSession.mockReturnValue({ data: user ? { user } : null });
    return renderWithUI(<AccountMenu />);
  };

  const openMenu = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button'));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders nothing when there is no authenticated user', () => {
    const { container } = setup(null);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders the avatar trigger when a user is authenticated', () => {
    setup();

    expect(screen.getByRole('button')).toBeInTheDocument();
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
    expect(profileItem).toHaveAttribute('href', `/profile/${MOCK_USER.id}`);
  });

  test('My Performance link points to the user performance page', async () => {
    const { user } = setup();

    await openMenu(user);

    const perfItem = await screen.findByRole('menuitem', {
      name: /my performance/i,
    });
    expect(perfItem).toHaveAttribute('href', `/performance/${MOCK_USER.id}`);
  });

  test('shows a Logout option when the menu is open', async () => {
    const { user } = setup();

    await openMenu(user);

    expect(await screen.findByText(/logout/i)).toBeInTheDocument();
  });

  test('calls signOut and redirects to login when Logout is clicked', async () => {
    mockSignOut.mockImplementation(
      async (opts?: { fetchOptions?: { onSuccess?: () => void } }) => {
        opts?.fetchOptions?.onSuccess?.();
      },
    );
    const { user } = setup();

    await openMenu(user);
    await user.click(await screen.findByText(/logout/i));

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(LOGIN_PATH);
  });
});
