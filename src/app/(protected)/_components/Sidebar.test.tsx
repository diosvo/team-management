import {
  createPermissionsMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import Sidebar, { SidebarToggle } from './Sidebar';

const { mockUseLinkStatus, mockUsePathname } = vi.hoisted(() => ({
  mockUseLinkStatus: vi.fn(() => ({ pending: false })),
  mockUsePathname: vi.fn(() => '/'),
}));

// Spreads the rest so `asChild` props (aria-label, class) reach the anchor.
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
  useLinkStatus: mockUseLinkStatus,
}));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: mockUsePathname,
}));

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

const FEEDBACK_URL_PART = 'github.com/diosvo/team-management/issues/new';

/** Allow only the given resources through `can()` */
const only =
  (...resources: string[]) =>
  (resource: string) =>
    resources.includes(resource);

const getLink = (name: RegExp | string) => screen.getByRole('link', { name });
const queryLink = (name: RegExp | string) =>
  screen.queryByRole('link', { name });

const fireScrollOnAll = (container: HTMLElement) => {
  for (const el of container.querySelectorAll<HTMLElement>('*')) {
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
  }
};

const onToggle = vi.fn();

/** `toggle` decides whether the collapse button is composed in, as the desktop rail does. */
const buildSidebar = ({
  isExpanded = true,
  toggle = true,
}: Partial<{ isExpanded: boolean; toggle: boolean }> = {}) => (
  <Sidebar isExpanded={isExpanded}>
    {toggle ? (
      <SidebarToggle isExpanded={isExpanded} onToggle={onToggle} />
    ) : null}
  </Sidebar>
);

describe('Sidebar', () => {
  const mockUsePermissions = vi.mocked(usePermissions);

  const setup = ({
    can = () => true,
    isExpanded = true,
    toggle = true,
    pathname = '/',
    pending = false,
  }: Partial<{
    can: (resource: string) => boolean;
    isExpanded: boolean;
    toggle: boolean;
    pathname: string;
    pending: boolean;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can }));
    mockUsePathname.mockReturnValue(pathname);
    mockUseLinkStatus.mockReturnValue({ pending });
    return renderWithUI(buildSidebar({ isExpanded, toggle }));
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  describe('permission filtering', () => {
    test('renders only nav items the user can view', () => {
      setup({ can: only('dashboard') });

      expect(getLink(/dashboard/i)).toBeInTheDocument();
      expect(queryLink(/roster/i)).not.toBeInTheDocument();
    });

    test('renders no nav links when user has no nav permissions', () => {
      setup({ can: () => false });

      const navLinks = screen.getAllByRole('link').filter((link) => {
        const href = link.getAttribute('href') ?? '';
        return !href.startsWith('http') && href !== '/docs';
      });

      expect(navLinks).toHaveLength(0);
    });

    test('renders all items when the user has full access', () => {
      setup();

      expect(getLink(/dashboard/i)).toBeInTheDocument();
      expect(getLink(/team rule/i)).toBeInTheDocument();
    });

    test('only shows groups with visible items', () => {
      setup({ can: only('dashboard', 'periodic-testing') });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(screen.getByText('PERFORMANCE')).toBeInTheDocument();
      expect(screen.queryByText('TEAM MANAGEMENT')).not.toBeInTheDocument();
    });

    test('renders items under their respective groups', () => {
      setup({ can: only('dashboard', 'roster', 'emails') });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(getLink(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText('TEAM MANAGEMENT')).toBeInTheDocument();
      expect(getLink(/roster/i)).toBeInTheDocument();
      expect(screen.getByText('RESOURCES')).toBeInTheDocument();
      expect(getLink(/emails/i)).toBeInTheDocument();
    });
  });

  describe('nav items', () => {
    test.each([
      ['team-rule', /team rule/i],
      ['periodic-testing', /periodic testing/i],
    ])('formats "%s" as a title-case label', (resource, label) => {
      setup({ can: only(resource) });

      expect(getLink(label)).toBeInTheDocument();
    });

    test('links point to the resource route', () => {
      setup({ can: only('dashboard', 'roster') });

      expect(getLink(/dashboard/i)).toHaveAttribute('href', '/dashboard');
      expect(getLink(/roster/i)).toHaveAttribute('href', '/roster');
    });

    test.each(['/dashboard', '/roster'])(
      'renders the link regardless of active pathname (%s)',
      (pathname) => {
        setup({ can: only('dashboard'), pathname });

        expect(getLink(/dashboard/i)).toBeInTheDocument();
      },
    );

    test('keeps the link when pathname changes', () => {
      const { rerender } = setup({
        can: only('dashboard'),
        pathname: '/dashboard',
      });
      expect(getLink(/dashboard/i)).toBeInTheDocument();

      mockUsePathname.mockReturnValue('/roster');
      rerender(buildSidebar());

      expect(getLink(/dashboard/i)).toBeInTheDocument();
    });
  });

  describe('expanded / collapsed', () => {
    test('shows group titles and labels when expanded', () => {
      setup({ can: only('dashboard'), isExpanded: true });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(getLink(/dashboard/i)).toHaveTextContent('Dashboard');
    });

    // `Visibility` keeps the label subtree mounted so collapsing does not remount it.
    test('keeps group titles and labels mounted but hidden when collapsed', () => {
      setup({ can: only('dashboard'), isExpanded: false });

      expect(screen.getByText('OVERVIEW')).not.toBeVisible();
      expect(screen.getByText('Dashboard')).not.toBeVisible();
    });

    test('keeps the link reachable by name when collapsed', async () => {
      const { container } = setup({
        can: only('dashboard'),
        isExpanded: false,
      });

      expect(getLink(/dashboard/i)).toHaveAttribute('href', '/dashboard');
      await expectNoA11yViolations(container);
    });

    test('shows every group title when multiple groups are visible', () => {
      setup({ can: only('dashboard', 'roster') });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(screen.getByText('TEAM MANAGEMENT')).toBeInTheDocument();
    });
  });

  describe('disabled items', () => {
    test('renders as a disabled button instead of a link', () => {
      setup({ can: only('documents') });

      expect(queryLink(/documents/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /documents/i, hidden: true }),
      ).toBeDisabled();
    });

    test('still renders when the sidebar is collapsed', () => {
      const { container } = setup({
        can: only('documents'),
        isExpanded: false,
      });

      expect(container.querySelector('button:disabled')).toBeInTheDocument();
    });
  });

  describe('toggle button', () => {
    test.each([
      [true, 'Collapse menu', 'Expand menu'],
      [false, 'Expand menu', 'Collapse menu'],
    ])(
      'isExpanded=%s labels the toggle "%s"',
      (isExpanded, label, otherLabel) => {
        setup({ isExpanded });

        expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: otherLabel }),
        ).not.toBeInTheDocument();
      },
    );

    test('calls onToggle when clicked', async () => {
      const { user } = setup({ isExpanded: true });

      await user.click(screen.getByRole('button', { name: 'Collapse menu' }));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test('updates its label when isExpanded changes', () => {
      const { rerender } = setup({ isExpanded: true });
      expect(
        screen.getByRole('button', { name: 'Collapse menu' }),
      ).toBeInTheDocument();

      rerender(buildSidebar({ isExpanded: false }));

      expect(
        screen.getByRole('button', { name: 'Expand menu' }),
      ).toBeInTheDocument();
    });

    test('is absent when not composed in, as in the mobile drawer', () => {
      setup({ toggle: false });

      expect(
        screen.queryByRole('button', { name: 'Collapse menu' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Expand menu' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('loading indicator', () => {
    test.each([
      { isExpanded: true, pending: false },
      { isExpanded: true, pending: true },
      { isExpanded: false, pending: true },
    ])('renders without error (%o)', (props) => {
      const { container } = setup({ can: only('dashboard'), ...props });

      expect(container).toBeInTheDocument();
    });
  });

  describe('footer links', () => {
    test.each([
      ['Documentation', 'href="/docs"'],
      ['Suggestions + feedback + ideas', `href*="${FEEDBACK_URL_PART}"`],
    ])('%s opens in a new tab securely', (name, selector) => {
      setup();

      const link = getLink(name);
      expect(link).toBe(document.querySelector(`a[${selector}]`));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('feedback link includes the GitHub issue query parameters', () => {
      setup();

      const href = getLink('Suggestions + feedback + ideas').getAttribute(
        'href',
      );
      expect(href).toContain('title=Feedback');
      expect(href).toContain('labels=maintenance');
      expect(href).toContain('assignees=diosvo');
    });

    // The menu uses trigger `id` and `data-scope`; the tooltip must not overwrite them.
    test('social links trigger keeps the menu scope, not the tooltip one', () => {
      setup();

      const trigger = screen.getByRole('button', { name: 'Social Links' });
      expect(trigger).toHaveAttribute('data-scope', 'menu');
      expect(trigger.id).toMatch(/^menu:.*:trigger$/);
    });
  });

  describe('scroll handling', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test('mounts and unmounts without errors', () => {
      const { unmount } = setup();

      expect(() => unmount()).not.toThrow();
    });

    test('handles a scroll event and its idle timeout', () => {
      const { container } = setup();

      fireScrollOnAll(container);
      vi.advanceTimersByTime(900);

      expect(container).toBeInTheDocument();
    });

    test('resets the idle timeout on consecutive scroll events', () => {
      const { container } = setup();

      fireScrollOnAll(container);
      vi.advanceTimersByTime(400);
      fireScrollOnAll(container);
      vi.advanceTimersByTime(500);

      expect(container).toBeInTheDocument();
    });
  });
});
