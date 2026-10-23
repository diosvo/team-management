import type { ReactNode } from 'react';

import { MOCK_SESSION_USER } from '@/test/mocks/user';
import {
  createPermissionsMock,
  createSessionMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import { useSessionContext, type SessionUser } from '@/providers/session';

import QuickActions from './QuickActions';

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

  test('links View Schedule to the training page', async () => {
    setup();

    expect(
      await screen.findByRole('link', { name: 'View Schedule' }),
    ).toHaveAttribute('href', '/training');
  });

  test('links My Stats to the player stats page', async () => {
    setup({ isPlayer: true });

    expect(
      await screen.findByRole('link', { name: 'My Stats' }),
    ).toHaveAttribute('href', `/performance/${MOCK_SESSION_USER.id}`);
  });
});
