import { Mock } from 'vitest';

import { MOCK_LEAGUE } from '@/test/mocks/league';
import { MOCK_LOCATION, MOCK_LOCATION_2 } from '@/test/mocks/location';
import { MOCK_MATCH } from '@/test/mocks/match';
import { renderWithUI, screen } from '@/test/utilities';

import { getUpcomingMatches } from '@/actions/analytics';
import UpcomingMatches from './UpcomingMatches';

vi.mock('@/actions/analytics', () => ({
  getUpcomingMatches: vi.fn(),
}));

describe('UpcomingMatches', () => {
  const mockGetUpcomingMatches = getUpcomingMatches as unknown as Mock;

  const MOCK_MATCHES = [
    {
      ...MOCK_MATCH,
      match_id: 'match-today',
      date: new Date(),
      time: '10:00',
      location: { name: MOCK_LOCATION.name },
      league: { league_id: MOCK_LEAGUE.league_id, name: MOCK_LEAGUE.name },
    },
    {
      ...MOCK_MATCH,
      match_id: 'match-friendly',
      date: new Date('2099-12-31'),
      time: '14:00',
      location: { name: MOCK_LOCATION_2.name },
      league: null,
    },
  ];

  const setup = async (matches: unknown[]) => {
    mockGetUpcomingMatches.mockResolvedValue(matches);
    return renderWithUI(await UpcomingMatches());
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the card title and description', async () => {
    await setup([]);

    expect(screen.getByText('Upcoming Matches')).toBeInTheDocument();
    expect(screen.getByText('Next 3 scheduled games')).toBeInTheDocument();
  });

  test('renders the empty state when there are no matches', async () => {
    await setup([]);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(
      screen.getByText('Focus on training and get ready for the next game!'),
    ).toBeInTheDocument();
  });

  test('renders the match details, locations and league names', async () => {
    await setup(MOCK_MATCHES);

    expect(screen.getByText(MOCK_LOCATION.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_LOCATION_2.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_LEAGUE.name)).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  test('shows the TODAY badge for matches scheduled today', async () => {
    await setup(MOCK_MATCHES);

    expect(screen.getByText('TODAY')).toBeInTheDocument();
  });
});
