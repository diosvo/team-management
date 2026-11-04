import {
  enumText,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';
import {
  MOCK_MATCH_AVERAGES,
  createMatchRecord,
} from '@/test/mocks/performance';

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

describe('MatchPerformance', () => {
  setupTestLifecycle();

  const setup = (records: Array<MatchPerformanceRecord>, page = 1) => {
    const setParams = mockUseQueryStates({ page });
    const result = renderWithUI(
      <MatchPerformance data={{ records, averages: MOCK_MATCH_AVERAGES }} />,
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
    setup([createMatchRecord(1), createMatchRecord(2)]);

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
    setup([createMatchRecord(1), createMatchRecord(2)]);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Opponent 2');
    expect(rows[2]).toHaveTextContent('Opponent 1');
    expect(screen.getAllByText(enumText('matchResult', 'win'))).toHaveLength(2);
    expect(screen.getByText('82 - 70')).toBeInTheDocument();
  });

  test('shows the requested page and pages through the box scores', async () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      createMatchRecord(index + 1),
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
