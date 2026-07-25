import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import Sidebar from './Sidebar';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
  useLinkStatus: vi.fn(() => ({ pending: false })),
}));

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return { ...actual, usePathname: vi.fn(() => '/') };
});

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

describe('Sidebar', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const setIsExpanded = vi.fn();

  const setup = ({
    can = () => true,
    isExpanded = true,
  }: {
    can?: (resource: string) => boolean;
    isExpanded?: boolean;
  } = {}) => {
    mockUsePermissions.mockReturnValue({ can });
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

    test('renders nothing when the user has no view permissions', () => {
      setup({ can: () => false });

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('renders all permitted items when the user has full access', () => {
      setup();

      // Dashboard and Team Rule are in the Overview group
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
  });

  describe('disabled items', () => {
    test('renders disabled items as a non-link div', () => {
      // documents is always disabled
      setup({ can: (r) => r === 'documents' });

      expect(
        screen.queryByRole('link', { name: /documents/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('expand / collapse', () => {
    test('shows "Collapse menu" label when expanded', () => {
      setup({ isExpanded: true });

      expect(screen.getByText('Collapse menu')).toBeInTheDocument();
    });

    test('hides the label when collapsed', () => {
      setup({ isExpanded: false });

      expect(screen.queryByText('Collapse menu')).not.toBeInTheDocument();
    });

    test('calls setIsExpanded when the toggle button is clicked', async () => {
      const { user } = setup({ isExpanded: true });

      await user.click(screen.getByText('Collapse menu'));

      expect(setIsExpanded).toHaveBeenCalled();
    });
  });
});
