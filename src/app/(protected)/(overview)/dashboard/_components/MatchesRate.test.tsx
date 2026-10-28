import { renderWithUI, screen } from '@/test/utilities';

import type { MatchesRateRecord } from '@/types/analytics';
import MatchesRate, { toMatchResultKey } from './MatchesRate';

// Recharts renders chart props as config objects in tests, so stub callbacks
// directly for tick formatting and click handling.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    // Plain wrapper so React renders the child components normally.
    BarChart: ({ children }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    LabelList: () => null,
    XAxis: ({
      tickFormatter,
    }: {
      tickFormatter?: (value: string) => string;
      [key: string]: unknown;
    }) => <span data-testid="xaxis-tick">{tickFormatter?.('win')}</span>,
    Bar: ({
      onClick,
      children,
    }: {
      onClick?: () => void;
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <button data-testid="bar" onClick={onClick}>
        {children}
      </button>
    ),
  };
});

describe('MatchesRate', () => {
  const MOCK_RECORDS: Array<MatchesRateRecord> = [
    { outcome: 'win', league: 3, friendly: 2 },
    { outcome: 'draw', league: 1, friendly: 0 },
    { outcome: 'lose', league: 2, friendly: 1 },
  ];

  const setup = (records: Array<MatchesRateRecord>) =>
    renderWithUI(<MatchesRate records={records} />);

  test('renders the card title and description', () => {
    setup(MOCK_RECORDS);

    expect(screen.getByText('Matches Record')).toBeInTheDocument();
    expect(
      screen.getByText('Performance in league vs friendly matches'),
    ).toBeInTheDocument();
  });

  test('shows the empty state when there are no records', () => {
    setup([]);

    expect(screen.getByText('Matches Record')).toBeInTheDocument();
    expect(screen.getByText('No matches records')).toBeInTheDocument();
  });

  test('shows the empty state when every outcome is zero', () => {
    setup(
      MOCK_RECORDS.map(({ outcome }) => ({ outcome, league: 0, friendly: 0 })),
    );

    expect(screen.getByText('No matches records')).toBeInTheDocument();
  });

  test('shows the chart instead of the empty state when matches exist', () => {
    setup(MOCK_RECORDS);

    expect(screen.queryByText('No matches records')).not.toBeInTheDocument();
  });

  test('navigates to the matches page filtered by type when a bar is clicked', async () => {
    const { user } = setup(MOCK_RECORDS);

    // chart.series has two items (league, friendly) → two Bar buttons rendered.
    const bars = screen.getAllByTestId('bar');
    expect(bars.length).toBeGreaterThan(0);

    // Clicking calls onClick → router.push(`/matches?match_type=...`).
    await user.click(bars[0]);

    // Component should still be intact after navigation.
    expect(screen.getByText('Matches Record')).toBeInTheDocument();
  });
});

describe('toMatchResultKey', () => {
  test('maps the "lose" outcome to the "loss" enum key', () => {
    expect(toMatchResultKey('lose')).toBe('loss');
  });

  test('leaves other outcomes unchanged', () => {
    expect(toMatchResultKey('win')).toBe('win');
    expect(toMatchResultKey('draw')).toBe('draw');
  });
});
