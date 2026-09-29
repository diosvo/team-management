import {
  enumText,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import type {
  TestingOverview as TestingOverviewData,
  TestTypeProgress,
} from '@/types/performance';
import TestingOverview from './TestingOverview';

// Both charts are lazy recharts chunks; stub them so the test covers the cards.
vi.mock('../LazyCharts', () => ({
  TestProgressChart: ({
    type,
    subject,
  }: {
    type: TestTypeProgress;
    subject: string;
  }) => (
    <div data-testid="progress-chart">
      {type.name} · {subject}
    </div>
  ),
  TestRadarChart: ({
    points,
  }: {
    points: Array<{ name: string; percentile: number }>;
  }) => (
    <div data-testid="radar-chart">
      {points.map(({ name }) => name).join(',')}
    </div>
  ),
}));

const createType = (
  name: string,
  latest: Partial<TestTypeProgress['latest']> = {},
  overrides: Partial<TestTypeProgress> = {},
): TestTypeProgress => ({
  type_id: `type-${name}`,
  name,
  unit: 'seconds',
  lower_is_better: false,
  latest: {
    date: '2026-08-08',
    result: 10,
    previous: 9,
    improvement_pct: 5,
    team_avg: 9.5,
    percentile: 50,
    team_size: 4,
    ...latest,
  },
  series: [],
  ...overrides,
});

describe('TestingOverview', () => {
  setupTestLifecycle();

  const setup = (data: Partial<TestingOverviewData>, test?: string) => {
    const setParams = mockUseQueryStates({ test });
    const result = renderWithUI(
      <TestingOverview
        data={{ types: [], tests_taken: 0, last_tested: null, ...data }}
        subject="You"
      />,
    );
    return { ...result, setParams };
  };

  test('shows the empty state when there are no test results', () => {
    setup({});

    expect(screen.getByText('Fitness Tests')).toBeInTheDocument();
    expect(screen.getByText('No test results yet')).toBeInTheDocument();
  });

  test('selects the first test by default and describes its direction', () => {
    setup(
      {
        types: [
          createType('Sprint', {}, { lower_is_better: true }),
          createType('Jump'),
        ],
        last_tested: '2026-08-08',
      },
      'Unknown',
    );

    expect(screen.getByText(/^Last tested .* pick a test/)).toBeInTheDocument();
    expect(screen.getByTestId('progress-chart')).toHaveTextContent(
      'Sprint · You',
    );
    expect(
      screen.getByText(
        `Sprint (${enumText('testTypeUnit', 'seconds')}) · lower is better · dashed line is the team average on the same day`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sprint/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Jump/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('charts the test from the URL and selects another on click', async () => {
    const { setParams, user } = setup(
      { types: [createType('Sprint'), createType('Jump')] },
      'Jump',
    );

    expect(screen.getByTestId('progress-chart')).toHaveTextContent('Jump');
    expect(screen.getByText(/higher is better/)).toBeInTheDocument();
    expect(screen.queryByText(/^Last tested/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Sprint/ }));

    expect(setParams).toHaveBeenCalledWith({ test: 'Sprint' });
  });

  test('shows each improvement badge and team comparison', () => {
    setup({
      types: [
        createType('Up', { improvement_pct: 5 }),
        createType('Down', { improvement_pct: -3 }),
        createType('Flat', { improvement_pct: 0 }),
        createType('New', {
          improvement_pct: null,
          team_avg: null,
          percentile: null,
        }),
      ],
    });

    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('-3%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('First result')).toBeInTheDocument();
    expect(screen.getByText('No teammates tested')).toBeInTheDocument();
    expect(
      screen.getAllByText('Team avg 9.5 · Better than 50% of teammates'),
    ).toHaveLength(3);
  });

  test('draws the radar once three tests have a percentile', () => {
    setup({
      types: [
        createType('Sprint'),
        createType('Jump'),
        createType('Plank'),
        createType('Solo', { percentile: null }),
      ],
    });

    expect(screen.getByTestId('radar-chart')).toHaveTextContent(
      'Sprint,Jump,Plank',
    );
  });

  test('falls back to progress bars below three comparable tests', () => {
    setup({
      types: [createType('Sprint', { percentile: 70 }), createType('Jump')],
    });

    expect(screen.queryByTestId('radar-chart')).not.toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  test('shows the no-comparison state when no test has a percentile', () => {
    setup({ types: [createType('Sprint', { percentile: null })] });

    expect(screen.getByText('No comparison yet')).toBeInTheDocument();
  });
});
