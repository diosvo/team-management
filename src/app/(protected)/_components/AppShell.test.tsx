import {
  createSessionMock,
  createToasterMock,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { useSessionContext } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';

import AppShell from './AppShell';

const replace = vi.fn();

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return { ...actual, useRouter: vi.fn(() => ({ replace })) };
});

vi.mock('@/providers/session', () => ({ useSessionContext: vi.fn() }));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// Stub the heavy children so AppShell can be tested in isolation.
vi.mock('./AppHeader', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('./Sidebar', () => ({
  default: () => <nav data-testid="sidebar" />,
}));

vi.mock('./Breadcrumbs', () => ({
  default: () => <div data-testid="breadcrumbs" />,
}));

describe('AppShell', () => {
  const mockUseSessionContext = vi.mocked(useSessionContext);

  const setup = ({
    isAuthenticated = true,
    isLoading = false,
  }: {
    isAuthenticated?: boolean;
    isLoading?: boolean;
  } = {}) => {
    mockUseSessionContext.mockReturnValue(
      createSessionMock({ isAuthenticated, isLoading }),
    );
    return renderWithUI(
      <AppShell>
        <div data-testid="content" />
      </AppShell>,
    );
  };

  setupTestLifecycle();

  describe('rendering', () => {
    test('renders the header, sidebar and breadcrumbs', () => {
      setup();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    });

    test('renders the children', () => {
      setup();

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('authentication redirect', () => {
    test('redirects to login when the user is unauthenticated and loading has finished', () => {
      setup({ isAuthenticated: false, isLoading: false });

      expect(replace).toHaveBeenCalledWith(LOGIN_PATH);
    });

    test('does not redirect while the session is still loading', () => {
      setup({ isAuthenticated: false, isLoading: true });

      expect(replace).not.toHaveBeenCalled();
    });

    test('does not redirect when the user is authenticated', () => {
      setup({ isAuthenticated: true, isLoading: false });

      expect(replace).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    test('dismisses any lingering toasts on unmount', () => {
      vi.useFakeTimers();

      const { unmount } = setup();
      unmount();
      vi.runAllTimers();

      expect(mockToaster.dismiss).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
