import { axe } from 'jest-axe';
import * as nuqs from 'nuqs';
import { SWRConfig } from 'swr';
import { Mock } from 'vitest';

import { MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { submitLeave } from '@/actions/attendance';
import { getActivePlayers } from '@/actions/user';
import { AttendanceStatus } from '@/utils/enum';
import BulkAttendanceManager from './BulkAttendanceManager';

vi.mock('@/actions/attendance', () => ({
  submitLeave: vi.fn(),
}));

vi.mock('@/actions/user', () => ({
  getActivePlayers: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const withFreshSWR = (ui: React.ReactElement) => (
  <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>
);

describe('BulkAttendanceManager', () => {
  const setSearchParams = vi.fn();
  const mockSubmitLeave = vi.mocked(submitLeave);
  const mockGetActivePlayers = vi.mocked(getActivePlayers);

  const setup = () => {
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      {},
      setSearchParams,
    ]);

    return renderWithUI(
      withFreshSWR(<BulkAttendanceManager trigger={<button>Open</button>} />),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitLeave.mockResolvedValue({ success: true, message: 'ok' });
    mockGetActivePlayers.mockResolvedValue([MOCK_USER_WITH_PLAYER]);
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders the trigger and keeps the dialog closed initially', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByText('Mark Bulk Attendance')).not.toBeInTheDocument();
  });

  test('opens the dialog with a date field', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByText('Mark Bulk Attendance')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  test('marks every active player on time when none are selected', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByText('Mark Bulk Attendance');

    // Wait for the active players to load via SWR before submitting.
    await waitFor(() => expect(mockGetActivePlayers).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(mockSubmitLeave).toHaveBeenCalledTimes(1));
    expect(mockSubmitLeave).toHaveBeenCalledWith(
      expect.objectContaining({
        player_id: MOCK_USER_WITH_PLAYER.id,
        status: AttendanceStatus.ON_TIME,
      }),
    );
  });
});
