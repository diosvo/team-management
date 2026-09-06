import type { ReactNode } from 'react';

import { MOCK_SESSION_USER } from '@/test/mocks/user';
import {
  createPermissionsMock,
  createSessionMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import { useSessionContext, type SessionUser } from '@/providers/session';

import QuickActions from './QuickActions';

const mockPush = vi.fn();

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: () => ({ push: mockPush }),
  };
});

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/providers/session', () => ({
  useSessionContext: vi.fn(),
}));

// The dialog-heavy actions are exercised by their own tests; render the trigger only.
vi.mock(
  '@/app/(protected)/(team-management)/attendance/_components/SubmitLeaveRequest',
  () => ({
    default: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
  }),
);

vi.mock(
  '@/app/(protected)/(team-management)/attendance/_components/BulkAttendanceManager',
  () => ({
    default: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
  }),
);

describe('QuickActions', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockUseSessionContext = vi.mocked(useSessionContext);

  const setup = ({
    isAdmin = false,
    isPlayer = false,
    user = MOCK_SESSION_USER,
  }: {
    isAdmin?: boolean;
    isPlayer?: boolean;
    user?: Nullable<SessionUser>;
  } = {}) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ isAdmin, isPlayer }),
    );
    mockUseSessionContext.mockReturnValue(createSessionMock({ user }));

    return renderWithUI(<QuickActions />);
  };

  setupTestLifecycle();

  test('renders the card title and description once mounted', async () => {
    setup();

    expect(await screen.findByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Shortcuts to common tasks')).toBeInTheDocument();
  });

  test('renders the default actions for any logged-in user', async () => {
    setup();

    expect(await screen.findByText('View Schedule')).toBeInTheDocument();
    expect(screen.getByText('Match Results')).toBeInTheDocument();
  });

  test('shows player-only actions for players', async () => {
    setup({ isPlayer: true });

    expect(await screen.findByText('My Stats')).toBeInTheDocument();
    expect(screen.getByText('Submit Leave')).toBeInTheDocument();
  });

  test('hides player-only actions for non-players', async () => {
    setup({ isPlayer: false });

    await screen.findByText('View Schedule');
    expect(screen.queryByText('Submit Leave')).not.toBeInTheDocument();
  });

  test('shows the mark attendance action for admins', async () => {
    setup({ isAdmin: true });

    expect(await screen.findByText('Mark Attendance')).toBeInTheDocument();
  });

  test('navigates to the schedule when View Schedule is clicked', async () => {
    const { user } = setup();

    await user.click(await screen.findByText('View Schedule'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/training');
    });
  });

  test('navigates to the player stats page when My Stats is clicked', async () => {
    const { user } = setup({ isPlayer: true });

    await user.click(await screen.findByText('My Stats'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        `/performance/${MOCK_SESSION_USER.id}`,
      );
    });
  });
});
