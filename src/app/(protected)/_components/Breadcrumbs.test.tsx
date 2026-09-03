
import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { usePathname } from 'next/navigation';

import Breadcrumbs from './Breadcrumbs';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return { ...actual, usePathname: vi.fn(() => '/') };
});

describe('Breadcrumbs', () => {
  const mockUsePathname = vi.mocked(usePathname);

  const setup = (pathname = '/') => {
    mockUsePathname.mockReturnValue(pathname);
    return renderWithUI(<Breadcrumbs />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup('/roster');

    await expectNoA11yViolations(container);
  });

  test('renders nothing when at the root path', () => {
    const { container } = setup('/');

    expect(container).toBeEmptyDOMElement();
  });

  test('renders a single segment as the current crumb with no href', () => {
    setup('/roster');

    const crumb = screen.getByText('Roster');
    expect(crumb).toHaveAttribute('aria-current', 'page');
    expect(crumb).not.toHaveAttribute('href');
  });

  test('renders intermediate segments as links pointing to their cumulative path', () => {
    setup('/roster/details');

    const link = screen.getByRole('link', { name: /roster/i });
    expect(link).toHaveAttribute('href', '/roster');
  });

  test('renders the last segment as the current crumb without an href', () => {
    setup('/roster/details');

    const crumb = screen.getByText('Details');
    expect(crumb).toHaveAttribute('aria-current', 'page');
    expect(crumb).not.toHaveAttribute('href');
  });

  test('formats hyphenated segments into title case', () => {
    setup('/periodic-testing/results');

    expect(screen.getByText('Periodic Testing')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  test('renders separators between crumbs', () => {
    const { container } = setup('/roster/details');

    // One separator between two crumbs.
    expect(
      container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThanOrEqual(1);
  });

  test('renders non-navigable segments as plain text instead of a link', () => {
    // `profile` only exists as `/profile/[id]`, so it must not be a link.
    setup('/profile/123');

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /^profile$/i }),
    ).not.toBeInTheDocument();
  });

  test('ignores empty segments from trailing or duplicate slashes', () => {
    setup('/roster//details/');

    expect(
      screen.getByRole('link', { name: /roster/i }),
    ).toHaveAttribute('href', '/roster');
    expect(screen.getByText('Details')).toBeInTheDocument();
  });
});
