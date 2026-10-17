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

import { setLocale } from '@/actions/locale';
import { useUserAvatar } from '@/hooks/use-image';
import authClient from '@/lib/auth-client';
import { useSessionContext, type SessionUser } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';

import AccountMenu, { SOCIAL_LINKS } from './AccountMenu';

const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
  };
});

vi.mock('@/providers/session', () => ({ useSessionContext: vi.fn() }));

vi.mock('@/hooks/use-image', () => ({ useUserAvatar: vi.fn() }));

vi.mock('@/actions/locale', () => ({ setLocale: vi.fn() }));

vi.mock('@/actions/feedback', () => ({ submitFeedback: vi.fn() }));

vi.mock('@/lib/auth-client', () => ({
  default: { signOut: vi.fn() },
}));

describe('AccountMenu', () => {
  setupTestLifecycle();

  const mockUseSessionContext = vi.mocked(useSessionContext);
  const mockUseUserAvatar = vi.mocked(useUserAvatar);
  const mockSignOut = vi.mocked(authClient.signOut);

  const setup = (
    user: Nullable<SessionUser> = MOCK_SESSION_USER,
    locale: 'en' | 'vi' = 'en',
  ) => {
    mockUseSessionContext.mockReturnValue(createSessionMock({ user }));
    mockUseUserAvatar.mockReturnValue(
      createSWRMock<Nullable<string>>({ data: null }),
    );
    return renderWithUI(<AccountMenu />, { locale });
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

  test('shows Profile and Performance links when the menu is open', async () => {
    const { user } = setup();

    await openMenu(user);

    expect(
      await screen.findByRole('menuitem', { name: /profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /^performance$/i }),
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

  test('Performance link points to the user performance page', async () => {
    const { user } = setup();

    await openMenu(user);

    const perfItem = await screen.findByRole('menuitem', {
      name: /^performance$/i,
    });
    expect(perfItem).toHaveAttribute(
      'href',
      `/performance/${MOCK_SESSION_USER.id}`,
    );
  });

  test('shows a Log Out option when the menu is open', async () => {
    const { user } = setup();

    await openMenu(user);

    expect(await screen.findByText(/log out/i)).toBeInTheDocument();
  });

  test('calls signOut and redirects to login when Log Out is clicked', async () => {
    mockSignOut.mockImplementation(async (options) => {
      const { fetchOptions } = (options ?? {}) as { fetchOptions?: unknown };
      authCallbacks(fetchOptions).onSuccess?.();
    });
    const { user } = setup();

    await openMenu(user);
    await user.click(await screen.findByText(/log out/i));

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(LOGIN_PATH);
  });

  test('shows the signed-in user at the top', async () => {
    const { user } = setup();

    await openMenu(user);

    expect(await screen.findByText(MOCK_SESSION_USER.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_SESSION_USER.email)).toBeInTheDocument();
  });

  describe('Vietnamese switch', () => {
    const vietnamese = (name = 'Vietnamese') =>
      screen.findByRole('menuitemcheckbox', { name });

    test('is off in English', async () => {
      const { user } = setup();

      await openMenu(user);

      expect(await vietnamese()).toHaveAttribute('aria-checked', 'false');
    });

    test('is on in Vietnamese', async () => {
      const { user } = setup(MOCK_SESSION_USER, 'vi');

      await openMenu(user);

      expect(await vietnamese('Tiếng Việt')).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    test.each([
      ['en', 'Vietnamese', 'vi'],
      ['vi', 'Tiếng Việt', 'en'],
    ] as const)(
      'switches from %s and refreshes the page',
      async (locale, name, next) => {
        const { user } = setup(MOCK_SESSION_USER, locale);

        await openMenu(user);
        await user.click(await vietnamese(name));

        await waitFor(() => {
          expect(setLocale).toHaveBeenCalledWith(next);
          expect(mockRefresh).toHaveBeenCalled();
        });
      },
    );

    test('keeps the menu open while toggling', async () => {
      const { user } = setup();

      await openMenu(user);
      await user.click(await vietnamese());

      expect(screen.getByRole('menu')).toBeVisible();
    });
  });

  test('opens the documentation in a new tab securely', async () => {
    const { user } = setup();

    await openMenu(user);

    const docs = await screen.findByRole('menuitem', {
      name: 'Documentation',
    });
    expect(docs).toHaveAttribute('href', '/docs');
    expect(docs).toHaveAttribute('target', '_blank');
    expect(docs).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('lists the social links in a submenu', async () => {
    const { user } = setup();

    await openMenu(user);
    await user.click(
      await screen.findByRole('menuitem', { name: /social links/i }),
    );

    for (const { label, href } of SOCIAL_LINKS) {
      expect(
        await screen.findByRole('menuitem', { name: label }),
      ).toHaveAttribute('href', `https://${href}`);
    }
  });

  test('opens the feedback dialog', async () => {
    const { user } = setup();

    await openMenu(user);
    await user.click(await screen.findByRole('menuitem', { name: 'Feedback' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Share Feedback',
    );
  });

  test('speaks Vietnamese', async () => {
    const { user } = setup(MOCK_SESSION_USER, 'vi');

    await openMenu(user);

    for (const name of [
      'Thông tin cá nhân',
      'Phong độ',
      'Tài liệu',
      /mạng xã hội/i,
      'Góp ý',
      /đăng xuất/i,
    ]) {
      expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument();
    }
  });
});
