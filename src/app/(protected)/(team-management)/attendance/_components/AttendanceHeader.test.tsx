import { axe } from 'jest-axe';

import usePermissions from '@/hooks/use-permissions';
import { renderWithUI, screen } from '@/test/utilities';

import AttendanceHeader from './AttendanceHeader';

// Stub heavy dialog children so the header is tested in isolation.
// Each renders its `trigger`, mirroring the real components' public surface.
vi.mock('./BulkAttendanceManager', () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));
vi.mock('./SubmitLeaveRequest', () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

describe('AttendanceHeader', () => {
  const mockUsePermissions = vi.mocked(usePermissions);

  const setPermissions = (isAdmin: boolean, isPlayer: boolean) => {
    mockUsePermissions.mockReturnValue({ isAdmin, isPlayer } as ReturnType<
      typeof usePermissions
    >);
  };

  const setup = ({ isAdmin = false, isPlayer = false } = {}) => {
    setPermissions(isAdmin, isPlayer);
    return renderWithUI(<AttendanceHeader />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup({ isAdmin: true, isPlayer: false });

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('always renders the page title', () => {
    setup();

    expect(screen.getByText('Training Attendance')).toBeInTheDocument();
  });

  test('shows "Mark Attendance" for admins only', () => {
    setup({ isAdmin: true, isPlayer: false });

    expect(
      screen.getByRole('button', { name: /mark attendance/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /submit leave request/i }),
    ).not.toBeInTheDocument();
  });

  test('shows "Submit Leave Request" for players only', () => {
    setup({ isAdmin: false, isPlayer: true });

    expect(
      screen.getByRole('button', { name: /submit leave request/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /mark attendance/i }),
    ).not.toBeInTheDocument();
  });

  test('shows no action buttons for guests', () => {
    setup({ isAdmin: false, isPlayer: false });

    expect(
      screen.queryByRole('button', { name: /mark attendance/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /submit leave request/i }),
    ).not.toBeInTheDocument();
  });
});
