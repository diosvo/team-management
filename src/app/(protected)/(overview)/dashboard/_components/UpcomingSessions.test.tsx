
import { MOCK_LOCATION, MOCK_LOCATION_2 } from '@/test/mocks/location';
import { MOCK_TRAINING_SESSION } from '@/test/mocks/training-sessions';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { getUpcomingSessions } from '@/actions/analytics';
import UpcomingSessions from './UpcomingSessions';

vi.mock('@/actions/analytics', () => ({
  getUpcomingSessions: vi.fn(),
}));

describe('UpcomingSessions', () => {
  const mockGetUpcomingSessions = vi.mocked(getUpcomingSessions);

  // `date` arrives as a string from the action. A date-only string
  // ('yyyy-MM-dd') is parsed as UTC midnight, so `isToday` would miss the badge
  // on runners west of UTC; a full timestamp pins it to the current instant.
  const TODAY = new Date().toISOString();

  const MOCK_SESSIONS = [
    {
      ...MOCK_TRAINING_SESSION,
      session_id: 'session-today',
      date: TODAY,
      start_time: '18:00',
      end_time: '20:00',
      location: { name: MOCK_LOCATION.name },
    },
    {
      ...MOCK_TRAINING_SESSION,
      session_id: 'session-future',
      date: '2099-12-31',
      start_time: '09:00',
      end_time: '11:00',
      location: { name: MOCK_LOCATION_2.name },
    },
  ];

  const setup = async (
    sessions: Awaited<ReturnType<typeof getUpcomingSessions>>,
  ) => {
    mockGetUpcomingSessions.mockResolvedValue(sessions);
    return renderWithUI(await UpcomingSessions());
  };

  setupTestLifecycle();

  test('renders the card title and description', async () => {
    await setup([]);

    expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
    expect(screen.getByText('Next 3 training sessions')).toBeInTheDocument();
  });

  test('renders the empty state when there are no sessions', async () => {
    await setup([]);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(
      screen.getByText('Upcoming training sessions will be coming soon.'),
    ).toBeInTheDocument();
  });

  test('renders the session times and locations', async () => {
    await setup(MOCK_SESSIONS);

    expect(screen.getByText(MOCK_LOCATION.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_LOCATION_2.name)).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });

  test('shows the Today badge for sessions scheduled today', async () => {
    await setup(MOCK_SESSIONS);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});
