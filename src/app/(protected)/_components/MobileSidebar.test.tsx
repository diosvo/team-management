import {
  createSessionMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { useSessionContext } from '@/providers/session';

import { useBreakpointValue } from '@chakra-ui/react';
import MobileSidebar from './MobileSidebar';

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => '/dashboard'),
}));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: mockUsePathname,
}));

vi.mock('@/providers/session', () => ({ useSessionContext: vi.fn() }));

// Only the breakpoint hook is stubbed; the rest of Chakra renders for real.
vi.mock('@chakra-ui/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@chakra-ui/react')>()),
  useBreakpointValue: vi.fn(),
}));

// Stub the heavy Sidebar so MobileSidebar can be tested in isolation.
vi.mock('./Sidebar', () => ({
  default: () => <nav data-testid="sidebar" />,
}));

describe('MobileSidebar', () => {
  const mockUseSessionContext = vi.mocked(useSessionContext);
  const mockUseBreakpointValue = vi.mocked(useBreakpointValue);

  const setup = (isAuthenticated = true) => {
    mockUseSessionContext.mockReturnValue(
      createSessionMock({ isAuthenticated }),
    );
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseBreakpointValue.mockReturnValue(false); // mobile
    return renderWithUI(<MobileSidebar />);
  };

  const openDrawer = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(await screen.findByTestId('sidebar')).toBeInTheDocument();
  };

  const expectDrawerClosed = () =>
    waitFor(() =>
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument(),
    );

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders nothing when there is no active session', () => {
    const { container } = setup(false);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders the trigger button when a session exists', () => {
    setup();

    expect(
      screen.getByRole('button', { name: 'Open navigation' }),
    ).toBeInTheDocument();
  });

  test('opens the drawer and shows the Sidebar when the trigger is clicked', async () => {
    const { user } = setup();

    await openDrawer(user);
  });

  test('closes the drawer from its own close button', async () => {
    const { user } = setup();
    await openDrawer(user);

    await user.click(screen.getByRole('button', { name: /close/i }));

    await expectDrawerClosed();
  });

  test('closes the drawer once the viewport reaches the desktop breakpoint', async () => {
    const { user, rerender } = setup();
    await openDrawer(user);

    // Widening past `lg` hands navigation over to the persistent sidebar.
    mockUseBreakpointValue.mockReturnValue(true);
    rerender(<MobileSidebar />);

    await expectDrawerClosed();
  });

  test('closes the drawer when the pathname changes', async () => {
    const { user, rerender } = setup();
    await openDrawer(user);

    // Following a nav link inside the drawer navigates without unmounting it.
    mockUsePathname.mockReturnValue('/roster');
    rerender(<MobileSidebar />);

    await expectDrawerClosed();
  });

  test('keeps the drawer open across re-renders on the same pathname', async () => {
    const { user, rerender } = setup();
    await openDrawer(user);

    rerender(<MobileSidebar />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});
