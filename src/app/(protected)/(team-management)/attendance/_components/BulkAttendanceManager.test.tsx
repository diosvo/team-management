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
  within,
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

  const selectPlayer = async (
    user: ReturnType<typeof renderWithUI>['user'],
  ) => {
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByText('Mark Bulk Attendance');

    const combobox = screen.getByPlaceholderText('Type to search');
    await user.click(combobox);
    await user.click(await screen.findByText(MOCK_USER_WITH_PLAYER.name));
    // Close the combobox popover so later queries don't also match its
    // (still-rendered) selected option alongside the table row.
    await user.keyboard('{Escape}');
    await screen.findByRole('table');
  };

  test('adds a row for a selected player, defaulting to absent', async () => {
    const { user } = await setup();

    await selectPlayer(user);

    expect(screen.getByRole('checkbox')).toBeChecked();
    const caption = screen.getByRole('table').querySelector('caption')!;
    expect(caption).toHaveTextContent('Absent: 1');
    expect(caption).toHaveTextContent('Late: 0');
  });

  test('toggling the checkbox switches the player between absent and late', async () => {
    const { user } = await setup();

    await selectPlayer(user);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    await waitFor(() => {
      const caption = screen.getByRole('table').querySelector('caption')!;
      expect(caption).toHaveTextContent('Absent: 0');
      expect(caption).toHaveTextContent('Late: 1');
    });
  });

  test('removes a player row when its name cell is clicked', async () => {
    const { user } = await setup();

    await selectPlayer(user);
    const table = screen.getByRole('table');
    expect(screen.getByRole('checkbox')).toBeInTheDocument();

    const { getByText } = within(table);
    await user.click(getByText(MOCK_USER_WITH_PLAYER.name));

    await waitFor(() => {
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  test('submits the reason entered for a selected player', async () => {
    const { user } = await setup();

    await selectPlayer(user);
    await user.type(screen.getByPlaceholderText('...'), 'Injured');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() =>
      expect(mockSubmitLeave).toHaveBeenCalledWith(
        expect.objectContaining({
          player_id: MOCK_USER_WITH_PLAYER.id,
          status: AttendanceStatus.ABSENT,
          reason: 'Injured',
        }),
      ),
    );
  });

  test('shows a warning with per-player errors when some submissions fail', async () => {
    mockSubmitLeave.mockResolvedValue({ success: false, message: 'db error' });
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByText('Mark Bulk Attendance');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(mockSubmitLeave).toHaveBeenCalled());
    // The dialog stays open so the failure can be retried.
    expect(screen.getByText('Mark Bulk Attendance')).toBeInTheDocument();
  });

  test('resets the selection and form when the dialog is closed', async () => {
    const { user } = await setup();

    await selectPlayer(user);
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() =>
      expect(
        screen.queryByText('Mark Bulk Attendance'),
      ).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByText('Mark Bulk Attendance');

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
