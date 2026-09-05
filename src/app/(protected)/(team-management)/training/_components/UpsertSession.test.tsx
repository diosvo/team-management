import {
  act,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { SessionStatus } from '@/utils/enum';

import { upsertSession } from '@/actions/training-session';

import { UpsertSession } from './UpsertSession';

vi.mock('@/actions/training-session', () => ({
  upsertSession: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// The location picker fetches its own options and has its own tests.
vi.mock('@/components/common/LocationSelection', () => ({
  default: () => <div data-testid="location-selection" />,
}));

describe('UpsertSession', () => {
  const mockUpsertSession = vi.mocked(upsertSession);

  const EXISTING_SESSION = {
    session_id: 'session-123',
    date: '2026-12-12',
    start_time: '09:00:00',
    end_time: '11:00:00',
    location_id: null,
    status: SessionStatus.SCHEDULED,
  };

  const open = async (
    action: 'Create' | 'Update' = 'Create',
    item: Record<string, unknown> = { session_id: '' },
  ) => {
    const view = renderWithUI(<UpsertSession.Viewport />);

    // Match the id the component closes on submit for the "Update" action.
    const id = action === 'Update' ? 'update-session' : 'new-session';
    await act(async () => {
      UpsertSession.open(id, { action, item });
    });

    return view;
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpsertSession.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Create');

    expect(await screen.findByText('Create Session')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getByText('End Time')).toBeInTheDocument();
  });

  test('renders the location picker', async () => {
    await open('Create');

    expect(await screen.findByTestId('location-selection')).toBeInTheDocument();
  });

  test('derives the read-only day from the chosen date', async () => {
    await open('Update', EXISTING_SESSION);

    await screen.findByText('Update Session');

    // 2026-12-12 falls on a Saturday.
    expect(screen.getByDisplayValue('Saturday')).toBeInTheDocument();
  });

  test('shows the last updated timestamp when the session has one', async () => {
    await open('Update', {
      ...EXISTING_SESSION,
      updated_at: new Date('2026-02-01T10:00:00Z'),
    });

    expect(await screen.findByText(/Last updated on/)).toBeInTheDocument();
  });

  test('submits the session through upsertSession', async () => {
    mockUpsertSession.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', EXISTING_SESSION);

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertSession).toHaveBeenCalledWith(
        EXISTING_SESSION.session_id,
        expect.objectContaining({
          date: EXISTING_SESSION.date,
          start_time: EXISTING_SESSION.start_time,
          end_time: EXISTING_SESSION.end_time,
        }),
      );
    });
  });

  test('cannot be submitted when the end time is not after the start time', async () => {
    const { user } = await open('Update', {
      ...EXISTING_SESSION,
      end_time: '08:00:00',
    });

    // The schema refinement leaves the form invalid, which keeps submit off.
    const submit = await screen.findByRole('button', { name: /update/i });
    expect(submit).toBeDisabled();

    await user.click(submit);

    expect(mockUpsertSession).not.toHaveBeenCalled();
  });

  test('reports a failed save through the toaster', async () => {
    mockUpsertSession.mockResolvedValue({
      success: false,
      message: 'A session already exists that day',
    });

    const { user } = await open('Update', EXISTING_SESSION);

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({
          type: 'error',
          title: 'A session already exists that day',
        }),
      );
    });
  });
});
