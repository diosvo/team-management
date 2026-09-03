import { MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import {
  createToasterMock,
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  waitFor,
  waitForStable,
  withFreshSWR,
} from '@/test/utilities';

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

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('BulkAttendanceManager', () => {
  const mockSubmitLeave = vi.mocked(submitLeave);
  const mockGetActivePlayers = vi.mocked(getActivePlayers);

  const setup = async () => {
    mockUseQueryStates({});

    const result = renderWithUI(
      withFreshSWR(<BulkAttendanceManager trigger={<button>Open</button>} />),
    );

    // Flush the SWR players fetch and the form's initial validation so their
    // state updates land inside act(...).
    await waitFor(() => expect(mockGetActivePlayers).toHaveBeenCalled());
    await waitForStable();

    return result;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitLeave.mockResolvedValue({ success: true, message: 'ok' });
    mockGetActivePlayers.mockResolvedValue([MOCK_USER_WITH_PLAYER]);
  });

  test('should be accessible', async () => {
    const { container } = await setup();

    await expectNoA11yViolations(container);
  });

  test('renders the trigger and keeps the dialog closed initially', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByText('Mark Bulk Attendance')).not.toBeInTheDocument();
  });

  test('opens the dialog with a date field', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByText('Mark Bulk Attendance')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  test('marks every active player on time when none are selected', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByText('Mark Bulk Attendance');

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
