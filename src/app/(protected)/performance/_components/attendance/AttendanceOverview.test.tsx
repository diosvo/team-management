import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import type { AttendanceOverview as AttendanceOverviewData } from '@/types/performance';

import AttendanceOverview from './AttendanceOverview';

// The chart is covered by its own test; capture the props it receives.
const chartProps = vi.fn();
vi.mock('../LazyCharts', () => ({
  AttendanceTrendChart: (props: unknown) => {
    chartProps(props);
    return <div data-testid="trend-chart" />;
  },
}));

const DATA: AttendanceOverviewData = {
  total: 10,
  on_time: 6,
  late: 2,
  absent: 2,
  rate: 80,
  team_rate: 72.5,
  current_streak: 2,
  best_streak: 4,
  trend: { recent: 90, previous: 70, delta: 20 },
  monthly: [{ month: '2026-01', player: 80, team: 72.5 }],
  reasons: [
    { name: 'Sick', count: 2 },
    { name: null, count: 1 },
  ],
};

const EMPTY: AttendanceOverviewData = {
  total: 0,
  on_time: 0,
  late: 0,
  absent: 0,
  rate: 0,
  team_rate: 0,
  current_streak: 0,
  best_streak: 0,
  trend: null,
  monthly: [],
  reasons: [],
};

describe('AttendanceOverview', () => {
  setupTestLifecycle();

  const setup = (data: Partial<AttendanceOverviewData> = {}) =>
    renderWithUI(
      <AttendanceOverview data={{ ...DATA, ...data }} subject="You" />,
    );

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('charts the monthly records for the subject', () => {
    setup();

    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    expect(chartProps).toHaveBeenCalledWith({
      records: DATA.monthly,
      subject: 'You',
    });
  });

  test('renders the breakdown and the comparison against the team', () => {
    setup();

    expect(screen.getByText('On Time')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('You 80% · Team 72.5%')).toBeInTheDocument();
    expect(screen.getByText('+7.5 pts')).toBeInTheDocument();
  });

  test('compares the last weeks with the ones before', () => {
    setup();

    expect(screen.getByText('Last 4 weeks')).toBeInTheDocument();
    expect(screen.getByText('90% vs 70% before')).toBeInTheDocument();
    expect(screen.getByText(/\+20%/)).toBeInTheDocument();
  });

  test('lists the absence reasons, naming a missing one', () => {
    setup();

    expect(
      screen.getByText('Reasons for absences and late arrivals'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sick')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('×1')).toBeInTheDocument();
  });

  test('shows a drop below the team and a falling trend', () => {
    setup({
      rate: 60,
      team_rate: 72.5,
      trend: { recent: 50, previous: 70, delta: -20 },
    });

    expect(screen.getByText('-12.5 pts')).toBeInTheDocument();
    expect(screen.getByText(/-20%/)).toBeInTheDocument();
  });

  test('shows no change when level with the team and the trend', () => {
    setup({
      rate: 72.5,
      trend: { recent: 70, previous: 70, delta: 0 },
    });

    expect(screen.getByText('0 pts')).toBeInTheDocument();
    expect(screen.getByText(/^0%$/)).toBeInTheDocument();
  });

  test('renders the empty states when nothing was recorded', () => {
    renderWithUI(<AttendanceOverview data={EMPTY} subject="Jane" />);

    expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument();
    expect(screen.getByText('No attendance records')).toBeInTheDocument();
    expect(screen.getByText('–')).toBeInTheDocument();
    expect(
      screen.getByText('Not enough sessions in the last 8 weeks to compare.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Reasons for absences and late arrivals'),
    ).not.toBeInTheDocument();
  });
});
