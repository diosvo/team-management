import {
  enumText,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import type {
  MatchesOverview,
  MatchPerformanceRecord,
} from '@/types/performance';
import MatchPerformance from './MatchPerformance';

// The chart is a lazy recharts chunk; stub it so the test covers this card.
vi.mock('../LazyCharts', () => ({
  MatchStatsChart: ({
    records,
  }: {
    records: Array<MatchPerformanceRecord>;
  }) => (
    <div data-testid="match-stats-chart">
      {records.map(({ opponent }) => opponent).join(',')}
    </div>
  ),
}));

const createRecord = (index: number): MatchPerformanceRecord => ({
  match_id: `match-${index}`,
  date: `2026-08-${String(index).padStart(2, '0')}`,
  opponent: `Opponent ${index}`,
  result: 'win',
  score: `${80 + index} - 70`,
  points_scored: index,
  rebounds: 5,
  assists: 3,
  steals: 1,
  blocks: 0,
  turnovers: 2,
  fouls: 3,
  minutes_played: 25,
});

const AVERAGES: MatchesOverview['averages'] = {
  points_scored: 12.5,
  rebounds: 5,
  assists: 3,
  steals: 1,
  blocks: 0,
  turnovers: 2,
  minutes_played: 25,
};

describe('MatchPerformance', () => {
  setupTestLifecycle();

  const setup = (records: Array<MatchPerformanceRecord>, page = 1) => {
    const setParams = mockUseQueryStates({ page });
    const result = renderWithUI(
      <MatchPerformance data={{ records, averages: AVERAGES }} />,
    );
    return { ...result, setParams };
  };

  test('shows the empty state when there are no box scores', () => {
    setup([]);

    expect(screen.getByText('Match Statistics')).toBeInTheDocument();
    expect(screen.getByText('No box scores yet')).toBeInTheDocument();
    expect(screen.queryByTestId('match-stats-chart')).not.toBeInTheDocument();
  });

  test('renders the chart in chronological order with the averages', () => {
    setup([createRecord(1), createRecord(2)]);

    expect(screen.getByText('Recent Match Statistics')).toBeInTheDocument();
    expect(screen.getByTestId('match-stats-chart')).toHaveTextContent(
      'Opponent 1,Opponent 2',
    );
    expect(screen.getByText('Avg points')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
    // Fouls have no average card.
    expect(screen.queryByText('Avg personal fouls')).not.toBeInTheDocument();
  });

  test('lists box scores newest first with the result badge', () => {
    setup([createRecord(1), createRecord(2)]);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Opponent 2');
    expect(rows[2]).toHaveTextContent('Opponent 1');
    expect(screen.getAllByText(enumText('matchResult', 'win'))).toHaveLength(2);
    expect(screen.getByText('82 - 70')).toBeInTheDocument();
  });

  test('shows the requested page and pages through the box scores', async () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      createRecord(index + 1),
    );
    const { setParams, user } = setup(records, 2);

    // Page 2 holds the two oldest matches.
    expect(screen.getByText('Opponent 1')).toBeInTheDocument();
    expect(screen.getByText('Opponent 2')).toBeInTheDocument();
    expect(screen.queryByText('Opponent 12')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /previous page/i }));

    expect(setParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
    );
  });
});
