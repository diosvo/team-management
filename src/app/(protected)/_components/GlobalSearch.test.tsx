import { renderToString } from 'react-dom/server';

import { MOCK_SESSION_USER } from '@/test/mocks/user';
import {
  MESSAGES,
  Providers,
  createPermissionsMock,
  createSessionMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { useSessionContext, type SessionUser } from '@/providers/session';
import type { Locale } from '@/i18n/config';
import type { Resource } from '@/utils/permissions';

import GlobalSearch from './GlobalSearch';

const RECENT_KEY = 'global-search:recent';
const store = new Map<string, string>();
const mockPush = vi.fn();
const mockPathname = vi.fn(() => '/matches');

// Node's own (file-less) `localStorage` shadows jsdom's, so stand in for it.
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
});

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/providers/session', () => ({ useSessionContext: vi.fn() }));

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

describe('GlobalSearch', () => {
  setupTestLifecycle();

  beforeEach(() => {
    store.clear();
    mockPathname.mockReturnValue('/matches');
  });

  const setup = ({
    recent = [],
    user = MOCK_SESSION_USER,
    can = (resource) => resource !== 'emails',
    locale,
  }: {
    recent?: Array<string>;
    user?: Nullable<SessionUser>;
    can?: (resource: Resource) => boolean;
    locale?: Locale;
  } = {}) => {
    store.set(RECENT_KEY, JSON.stringify(recent));
    vi.mocked(useSessionContext).mockReturnValue(createSessionMock({ user }));
    vi.mocked(usePermissions).mockReturnValue(createPermissionsMock({ can }));

    return renderWithUI(<GlobalSearch />, { locale });
  };

  /** Open from the desktop trigger and focus the input, as a user would */
  const open = async ({ user }: ReturnType<typeof setup>) => {
    await user.click(
      screen.getAllByRole('button', { name: 'Search pages' })[1],
    );
    const input = await screen.findByPlaceholderText(/Search pages/);
    await user.click(input);
    return input;
  };

  const options = () =>
    screen.queryAllByRole('option').map(({ textContent }) => textContent);

  const highlighted = () =>
    screen
      .getAllByRole('option')
      .find((option) => option.hasAttribute('data-highlighted'))?.textContent;

  test('should be accessible', async () => {
    const view = setup({ recent: ['roster'] });
    await open(view);

    await expectNoA11yViolations();
  });

  describe('trigger', () => {
    test('shows the Ctrl shortcut, or ⌘ on a Mac', () => {
      const { unmount } = setup();
      expect(screen.getByText('Ctrl K')).toBeInTheDocument();
      unmount();

      const { navigator } = globalThis;
      vi.stubGlobal('navigator', { userAgent: 'Macintosh' });
      setup();
      expect(screen.getByText('⌘ K')).toBeInTheDocument();
      vi.stubGlobal('navigator', navigator);
    });

    test('shows the Ctrl shortcut when rendered on the server', () => {
      setup();

      expect(
        renderToString(
          <Providers>
            <GlobalSearch />
          </Providers>,
        ),
      ).toContain('Ctrl<!-- --> K');
    });

    test('opens from the mobile icon button', async () => {
      const { user } = setup();

      await user.click(
        screen.getAllByRole('button', { name: 'Search pages' })[0],
      );

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    test('toggles with ⌘K or Ctrl+K, but not a bare K', async () => {
      const { user } = setup();

      await user.keyboard('k');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.keyboard('{Control>}K{/Control}');
      expect(await screen.findByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Meta>}k{/Meta}');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    test('leaves focus off the trigger after closing', async () => {
      const view = setup();
      await open(view);

      await view.user.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(
        screen.getAllByRole('button', { name: 'Search pages' }),
      ).not.toContain(document.activeElement);
    });
  });

  describe('recent pages', () => {
    test('records the visited page', () => {
      setup();

      expect(JSON.parse(store.get(RECENT_KEY)!)).toEqual(['matches']);
    });

    test('ignores pages outside the index', () => {
      mockPathname.mockReturnValue('/docs');
      setup({ recent: ['roster'] });

      expect(JSON.parse(store.get(RECENT_KEY)!)).toEqual(['roster']);
    });

    test('lists up to 3 permitted visits', async () => {
      mockPathname.mockReturnValue('/docs');
      const view = setup({ recent: ['roster', 'emails', 'training', 'teams'] });
      await open(view);

      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(options()).toEqual([
        'RosterView the team rosterTeam Management',
        'Training SessionsManage and schedule training sessionsTeam Management',
        'TeamsManage and view opponent teams information.Settings',
      ]);
    });

    test('skips the current page', async () => {
      const view = setup({ recent: ['roster'] });
      await open(view);

      expect(options()).toEqual(['RosterView the team rosterTeam Management']);
    });

    test('opens the first recent page on Enter', async () => {
      const view = setup({ recent: ['roster', 'training'] });
      await open(view);

      await view.user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/roster');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });
  });

  describe('hint', () => {
    test('fills in a scoped search that opens the page with ?q=', async () => {
      const { exampleTerm } = MESSAGES.en.shell.search;
      const view = setup();
      const input = await open(view);

      await view.user.click(
        screen.getByRole('button', { name: `roster ${exampleTerm}` }),
      );

      expect(input).toHaveValue(`roster ${exampleTerm}`);
      expect(input).toHaveFocus();
      expect(
        screen.getByText(`Search “${exampleTerm}” within…`),
      ).toBeInTheDocument();
      expect(options()).toEqual(['RosterTeam Management']);

      await view.user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith(`/roster?q=${exampleTerm}`);
    });
  });

  describe('typing', () => {
    test('lists matching pages, then pages to search within', async () => {
      const view = setup();
      const input = await open(view);

      await view.user.type(input, 'sett');

      expect(screen.getByText('Pages')).toBeInTheDocument();
      expect(screen.getByText('Search “sett” within…')).toBeInTheDocument();
      expect(options()).toEqual([
        'TeamsManage and view opponent teams information.Settings',
        'LeaguesManage and view leagues information.Settings',
        'LocationsManage your location settings.Settings',
        'TeamsSettings',
        'LeaguesSettings',
        'LocationsSettings',
        'RosterTeam Management',
        'Training SessionsTeam Management',
      ]);
      expect(highlighted()).toBe(options()[0]);
    });

    test('moves the highlight with the arrow keys', async () => {
      const view = setup();
      const input = await open(view);

      await view.user.type(input, 'sett');
      await view.user.keyboard('{ArrowDown}');
      expect(highlighted()).toBe(options()[1]);

      await view.user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith('/leagues');
    });

    test('searches within a page on click', async () => {
      const view = setup();
      const input = await open(view);

      await view.user.type(input, 'Văn An');
      await view.user.click(screen.getByRole('option', { name: /Matches/ }));

      expect(mockPush).toHaveBeenCalledWith('/matches?q=V%C4%83n+An');
    });

    test("links Profile to the signed-in user's page", async () => {
      const view = setup();
      const input = await open(view);

      await view.user.type(input, 'profile');
      await view.user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith(`/profile/${MOCK_SESSION_USER.id}`);
    });

    test('hides Profile without a signed-in user', async () => {
      const view = setup({ user: null });
      const input = await open(view);

      await view.user.type(input, 'profile');

      expect(options()).not.toContainEqual(expect.stringMatching(/^Profile/));
    });
  });

  describe('without access', () => {
    test('shows no hint and an empty state', async () => {
      const view = setup({ can: () => false });
      const input = await open(view);

      expect(screen.queryByText(/Type a page name/)).not.toBeInTheDocument();

      await view.user.type(input, 'roster');

      expect(options()).toEqual([]);
      expect(screen.getByText('No pages match “roster”')).toBeInTheDocument();
    });
  });

  describe('in Vietnamese', () => {
    test('searches translated titles, accents optional', async () => {
      const { user } = setup({ locale: 'vi' });
      await user.keyboard('{Control>}k{/Control}');
      const input = await screen.findByPlaceholderText(/Tìm trang/);
      await user.click(input);

      await user.type(input, 'doi hinh nguyen');

      expect(screen.getByText('Tìm “nguyen” trong…')).toBeInTheDocument();
      expect(options()).toEqual(['Đội hìnhQuản lý đội']);

      await user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith('/roster?q=nguyen');
    });
  });
});
