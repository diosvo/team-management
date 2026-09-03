
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { loadDashboardFilters } from '@/lib/nuqs';
import { Interval } from '@/utils/enum';

import DashboardsPage from './page';

vi.mock('@/lib/nuqs', () => ({
  loadDashboardFilters: vi.fn(),
}));

// Child components are covered by their own tests; render lightweight markers
// here and capture the props the page wires through to them.
const propsSpy = {
  matchesRate: undefined as unknown,
  attendanceTrend: undefined as unknown,
  ranking: undefined as unknown,
  absence: undefined as unknown,
};

vi.mock('./_components/OverviewStats', () => ({
  default: () => <div>OverviewStats</div>,
}));
vi.mock('./_components/QuickActions', () => ({
  default: () => <div>QuickActions</div>,
}));
vi.mock('./_components/UpcomingSessions', () => ({
  default: () => <div>UpcomingSessions</div>,
}));
vi.mock('./_components/UpcomingMatches', () => ({
  default: () => <div>UpcomingMatches</div>,
}));
vi.mock('./_components/DashboardFilters', () => ({
  default: () => <div>DashboardFilters</div>,
}));
vi.mock('./_components/AnalyticsSections', () => ({
  MatchesRateSection: (props: unknown) => {
    propsSpy.matchesRate = props;
    return <div>MatchesRate</div>;
  },
  AttendanceTrendSection: (props: unknown) => {
    propsSpy.attendanceTrend = props;
    return <div>AttendanceTrend</div>;
  },
  PlayerAttendanceRankingSection: (props: unknown) => {
    propsSpy.ranking = props;
    return <div>PlayerAttendanceRanking</div>;
  },
  AbsenceReasonsBreakdownSection: (props: unknown) => {
    propsSpy.absence = props;
    return <div>AbsenceReasonsBreakdown</div>;
  },
}));

describe('DashboardsPage', () => {
  const mockLoadFilters = vi.mocked(loadDashboardFilters);

  const setup = async (interval: Interval = Interval.THIS_YEAR) => {
    // `page`/`q` come from the shared params; the page forwards `interval`.
    mockLoadFilters.mockResolvedValue({ interval, page: 1, q: '' });

    return renderWithUI(
      await DashboardsPage({ searchParams: Promise.resolve({}) } as never),
    );
  };

  setupTestLifecycle();

  test('renders the analytics page title', async () => {
    await setup();

    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  test('renders all dashboard sections', async () => {
    await setup();

    expect(screen.getByText('OverviewStats')).toBeInTheDocument();
    expect(screen.getByText('QuickActions')).toBeInTheDocument();
    expect(screen.getByText('UpcomingSessions')).toBeInTheDocument();
    expect(screen.getByText('UpcomingMatches')).toBeInTheDocument();
    expect(screen.getByText('DashboardFilters')).toBeInTheDocument();
    expect(screen.getByText('MatchesRate')).toBeInTheDocument();
    expect(screen.getByText('AttendanceTrend')).toBeInTheDocument();
    expect(screen.getByText('PlayerAttendanceRanking')).toBeInTheDocument();
    expect(screen.getByText('AbsenceReasonsBreakdown')).toBeInTheDocument();
  });

  test('passes the loaded interval to every analytics section', async () => {
    await setup(Interval.LAST_YEAR);

    expect(mockLoadFilters).toHaveBeenCalled();
    expect(propsSpy.matchesRate).toEqual({ interval: Interval.LAST_YEAR });
    expect(propsSpy.attendanceTrend).toEqual({ interval: Interval.LAST_YEAR });
    expect(propsSpy.ranking).toEqual({ interval: Interval.LAST_YEAR });
    expect(propsSpy.absence).toEqual({ interval: Interval.LAST_YEAR });
  });
});
