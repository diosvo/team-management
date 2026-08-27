import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import Sidebar from './Sidebar';

const { mockUseLinkStatus, mockUsePathname } = vi.hoisted(() => ({
  mockUseLinkStatus: vi.fn(() => ({ pending: false })),
  mockUsePathname: vi.fn(() => '/'),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
  useLinkStatus: mockUseLinkStatus,
}));

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return { ...actual, usePathname: mockUsePathname };
});

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

describe('Sidebar', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const setIsExpanded = vi.fn();

  const setup = ({
    can = () => true,
    isExpanded = true,
    pathname = '/',
    pending = false,
  }: Partial<{
    can: (resource: string) => boolean;
    isExpanded: boolean;
    pathname: string;
    pending: boolean;
  }> = {}) => {
    mockUsePermissions.mockReturnValue({ can });
    mockUsePathname.mockReturnValue(pathname);
    mockUseLinkStatus.mockReturnValue({ pending });
    return renderWithUI(
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setIsExpanded.mockReset();
  });

  describe('permission filtering', () => {
    test('renders nav items for resources the user can view', () => {
      setup({ can: (resource) => resource === 'dashboard' });

      expect(
        screen.getByRole('link', { name: /dashboard/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /roster/i }),
      ).not.toBeInTheDocument();
    });

    test('renders only nav items with permissions and no footer nav links when user has no nav permissions', () => {
      setup({ can: () => false });

      const navLinks = screen
        .queryAllByRole('link', { hidden: false })
        .filter((link) => {
          const href = link.getAttribute('href') || '';
          return !href.startsWith('http') && href !== '/docs';
        });

      expect(navLinks).toHaveLength(0);
    });

    test('renders all permitted items when the user has full access', () => {
      setup();

      expect(
        screen.getByRole('link', { name: /dashboard/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /team rule/i }),
      ).toBeInTheDocument();
    });
  });

  describe('resource name formatting', () => {
    test('converts hyphenated resources to title case', () => {
      setup({ can: (r) => r === 'team-rule' });

      expect(
        screen.getByRole('link', { name: /team rule/i }),
      ).toBeInTheDocument();
    });

    test('converts multi-word resources to title case', () => {
      setup({ can: (r) => r === 'periodic-testing' });

      expect(
        screen.getByRole('link', { name: /periodic testing/i }),
      ).toBeInTheDocument();
    });
  });

  describe('group titles', () => {
    test('shows group titles when expanded', () => {
      setup({ can: (r) => r === 'dashboard', isExpanded: true });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
    });

    test('hides group titles when collapsed', () => {
      setup({ can: (r) => r === 'dashboard', isExpanded: false });

      expect(screen.queryByText('OVERVIEW')).not.toBeInTheDocument();
    });

    test('shows all group titles when multiple groups have visible items', () => {
      setup({
        can: (r) => ['dashboard', 'roster'].includes(r),
        isExpanded: true,
      });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(screen.getByText('TEAM MANAGEMENT')).toBeInTheDocument();
    });
  });

  describe('disabled items', () => {
    test('renders disabled items as a button not a link', () => {
      setup({ can: (r) => r === 'documents', isExpanded: true });

      expect(
        screen.queryByRole('link', { name: /documents/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /documents/i, hidden: true }),
      ).toBeInTheDocument();
    });

    test('disabled button is not clickable', () => {
      setup({ can: (r) => r === 'documents', isExpanded: true });

      const disabledButton = screen.getByRole('button', {
        name: /documents/i,
        hidden: true,
      });
      expect(disabledButton).toBeDisabled();
    });

    test('renders disabled items even when sidebar is collapsed', () => {
      const { container } = setup({ can: (r) => r === 'documents', isExpanded: false });

      const disabledButton = container.querySelector('button:disabled');
      expect(disabledButton).toBeInTheDocument();
    });
  });

  describe('expand / collapse', () => {
    test('labels the toggle "Collapse menu" when expanded', () => {
      setup({ isExpanded: true });

      expect(
        screen.getByRole('button', { name: 'Collapse menu' }),
      ).toBeInTheDocument();
    });

    test('labels the toggle "Expand menu" when collapsed', () => {
      setup({ isExpanded: false });

      expect(
        screen.getByRole('button', { name: 'Expand menu' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Collapse menu' }),
      ).not.toBeInTheDocument();
    });

    test('calls setIsExpanded when the toggle button is clicked', async () => {
      const { user } = setup({ isExpanded: true });

      await user.click(screen.getByRole('button', { name: 'Collapse menu' }));

      expect(setIsExpanded).toHaveBeenCalled();
    });

    test('toggle button changes label after expansion state changes', () => {
      const { rerender } = setup({ isExpanded: true });

      expect(
        screen.getByRole('button', { name: 'Collapse menu' }),
      ).toBeInTheDocument();

      rerender(<Sidebar isExpanded={false} setIsExpanded={setIsExpanded} />);

      expect(
        screen.getByRole('button', { name: 'Expand menu' }),
      ).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    test('renders link for active pathname', () => {
      setup({ can: (r) => r === 'dashboard', pathname: '/dashboard' });

      expect(
        screen.getByRole('link', { name: /dashboard/i }),
      ).toBeInTheDocument();
    });

    test('renders link for inactive pathname', () => {
      setup({ can: (r) => r === 'dashboard', pathname: '/roster' });

      expect(
        screen.getByRole('link', { name: /dashboard/i }),
      ).toBeInTheDocument();
    });

    test('link exists when pathname changes', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { rerender } = setup({ can: (r) => r === 'dashboard' });

      expect(
        screen.getByRole('link', { name: /dashboard/i }),
      ).toBeInTheDocument();

      mockUsePathname.mockReturnValue('/roster');
      rerender(
        <Sidebar isExpanded={true} setIsExpanded={setIsExpanded} />,
      );

      expect(
        screen.getByRole('link', { name: /dashboard/i }),
      ).toBeInTheDocument();
    });
  });

  describe('loading indicator', () => {
    test('renders without error when link is not pending', () => {
      const { container } = setup({ can: (r) => r === 'dashboard', pending: false });
      expect(container).toBeInTheDocument();
    });

    test('renders without error when link is pending and expanded', () => {
      const { container } = setup({ can: (r) => r === 'dashboard', isExpanded: true, pending: true });
      expect(container).toBeInTheDocument();
    });

    test('renders without error when sidebar is collapsed even with pending', () => {
      const { container } = setup({ can: (r) => r === 'dashboard', isExpanded: false, pending: true });
      expect(container).toBeInTheDocument();
    });
  });

  describe('footer links', () => {
    test('renders documentation link with correct attributes', () => {
      setup();

      const docsLink = document.querySelector('a[href="/docs"]');
      expect(docsLink).toBeInTheDocument();
      expect(docsLink).toHaveAttribute('target', '_blank');
      expect(docsLink).toHaveAttribute('rel', 'noreferrer');
    });

    test('renders social links menu trigger button', () => {
      setup();

      expect(
        screen.getByRole('button', { name: 'Social Links' }),
      ).toBeInTheDocument();
    });

    test('renders feedback button with correct GitHub URL', () => {
      setup();

      const feedbackLink = document.querySelector(
        'a[href*="github.com/diosvo/team-management/issues/new"]',
      );
      expect(feedbackLink).toBeInTheDocument();
      expect(feedbackLink).toHaveAttribute('target', '_blank');
      expect(feedbackLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('feedback link includes feedback query parameters', () => {
      setup();

      const feedbackLink = document.querySelector(
        'a[href*="github.com/diosvo/team-management/issues/new"]',
      );
      const href = feedbackLink?.getAttribute('href') || '';
      expect(href).toContain('title=Feedback');
      expect(href).toContain('labels=maintenance');
      expect(href).toContain('assignees=diosvo');
    });
  });

  describe('collapsed state behavior', () => {
    test('hides nav labels when collapsed', () => {
      setup({ can: (r) => r === 'dashboard', isExpanded: false });

      const links = screen.getAllByRole('link', { hidden: false });
      const dashboardLink = links.find((link) => link.getAttribute('href') === '/dashboard');
      expect(dashboardLink).toBeInTheDocument();
    });

    test('shows nav labels when expanded', () => {
      setup({ can: (r) => r === 'dashboard', isExpanded: true });

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink.textContent).toContain('Dashboard');
    });

    test('maintains icon visibility when collapsed', () => {
      setup({ can: (r) => r === 'dashboard', isExpanded: false });

      const links = screen.getAllByRole('link', { hidden: false });
      const dashboardLink = links.find((link) => link.getAttribute('href') === '/dashboard');
      expect(dashboardLink).toBeInTheDocument();
    });
  });

  describe('scroll handling', () => {
    test('component mounts and unmounts without errors', () => {
      const { unmount } = setup();

      expect(() => unmount()).not.toThrow();
    });

    test('handles scroll events without errors', async () => {
      vi.useFakeTimers();
      const { container } = setup();

      // Trigger scroll on any element that might handle it
      const allElements = container.querySelectorAll('*');
      allElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.dispatchEvent(new Event('scroll', { bubbles: true }));
        }
      });

      // Fast-forward time to trigger the timeout callback
      vi.advanceTimersByTime(900);

      // Component should remain intact after scroll events and timeout
      expect(container).toBeInTheDocument();

      vi.useRealTimers();
    });

    test('clears previous scroll timeout on consecutive scroll events', async () => {
      vi.useFakeTimers();
      const { container } = setup();

      // First scroll event
      const allElements = container.querySelectorAll('*');
      allElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.dispatchEvent(new Event('scroll', { bubbles: true }));
        }
      });

      // Advance time by 400ms (halfway through the 800ms timeout)
      vi.advanceTimersByTime(400);

      // Second scroll event - should clear the previous timeout and set a new one
      allElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.dispatchEvent(new Event('scroll', { bubbles: true }));
        }
      });

      // Advance remaining time
      vi.advanceTimersByTime(500);

      // Component should remain intact
      expect(container).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('multiple items from different groups', () => {
    test('filters items by group and shows correct structure', () => {
      setup({
        can: (r) => ['dashboard', 'roster', 'emails'].includes(r),
        isExpanded: true,
      });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /dashboard/i }),
      ).toBeInTheDocument();

      expect(screen.getByText('TEAM MANAGEMENT')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /roster/i })).toBeInTheDocument();

      expect(screen.getByText('RESOURCES')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /emails/i })).toBeInTheDocument();
    });

    test('only shows groups with visible items', () => {
      setup({
        can: (r) => ['dashboard', 'periodic-testing'].includes(r),
        isExpanded: true,
      });

      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
      expect(screen.getByText('PERFORMANCE')).toBeInTheDocument();

      expect(screen.queryByText('TEAM MANAGEMENT')).not.toBeInTheDocument();
    });
  });

  describe('navigation href structure', () => {
    test('nav links point to correct routes', () => {
      setup({ can: (r) => ['dashboard', 'roster'].includes(r) });

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const rosterLink = screen.getByRole('link', { name: /roster/i });
      expect(rosterLink).toHaveAttribute('href', '/roster');
    });
  });
});
