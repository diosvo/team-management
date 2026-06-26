import { axe } from 'jest-axe';
import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_ATTENDANCE_BY_DATE } from '@/test/mocks/attendance';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { AttendanceWithPlayer } from '@/types/attendance';
import { AttendanceStatus } from '@/utils/enum';

import { removeAttendance, updateStatus } from '@/actions/attendance';

import AttendanceTable from './AttendanceTable';

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

vi.mock('@/actions/attendance', () => ({
  removeAttendance: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

describe('AttendanceTable', () => {
  const setSearchParams = vi.fn();
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemove = vi.mocked(removeAttendance);
  const mockUpdate = vi.mocked(updateStatus);

  const setup = ({
    attendances = MOCK_ATTENDANCE_BY_DATE,
    isAdmin = false,
    q = '',
    status = [] as Array<AttendanceStatus>,
    page = 1,
  }: {
    attendances?: Array<AttendanceWithPlayer>;
    isAdmin?: boolean;
    q?: string;
    status?: Array<AttendanceStatus>;
    page?: number;
  } = {}) => {
    mockUsePermissions.mockReturnValue({ isAdmin } as ReturnType<
      typeof usePermissions
    >);
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { q, status, page },
      setSearchParams,
    ]);

    return renderWithUI(<AttendanceTable attendances={attendances} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRemove.mockResolvedValue({ success: true, message: 'ok' });
    mockUpdate.mockResolvedValue({ success: true, message: 'ok' });
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders the column headers', () => {
    setup();

    ['Name', 'Status', 'Reason', 'Last Updated'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('renders a row for every attendance record', () => {
    setup();

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  test('renders the reason or a dash when empty', () => {
    setup();

    // Mock data: A has no reason, C has "Family emergency"
    expect(screen.getByText('Family emergency')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  test('filters rows by the search query', () => {
    setup({ q: 'A' });

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.queryByText('B')).not.toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();
  });

  test('filters rows by the active status', () => {
    setup({ status: [AttendanceStatus.ABSENT] });

    // Only player C is absent in the mock data
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('B')).not.toBeInTheDocument();
  });

  test('shows the empty state when no records match', () => {
    setup({ q: 'no-such-player' });

    expect(screen.getByText('No players found')).toBeInTheDocument();
  });

  test('hides selection checkboxes for non-admins', () => {
    setup({ isAdmin: false });

    expect(
      screen.queryByRole('checkbox', { name: 'Select all rows' }),
    ).not.toBeInTheDocument();
  });

  test('shows selection checkboxes for admins', () => {
    setup({ isAdmin: true });

    expect(
      screen.getByRole('checkbox', { name: 'Select all rows' }),
    ).toBeInTheDocument();
  });

  test('selecting all opens the action bar with the count', async () => {
    const { user } = setup({ isAdmin: true });

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(await screen.findByText('3 selected')).toBeInTheDocument();
  });

  test('bulk deletes the selected records', async () => {
    const { user } = setup({ isAdmin: true });

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    await screen.findByText('3 selected');
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledTimes(3));
  });

  test('bulk updates the selected records to a new status', async () => {
    const { user } = setup({ isAdmin: true });

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    await screen.findByText('3 selected');
    await user.click(screen.getByRole('button', { name: 'Late' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(3));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.any(String),
      AttendanceStatus.LATE,
    );
    await waitFor(() =>
      expect(setSearchParams).toHaveBeenCalledWith({
        status: [AttendanceStatus.LATE],
        page: 1,
      }),
    );
  });
});
