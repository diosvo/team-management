
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { loadDashboardFilters } from '@/lib/nuqs';
import type { DateRange } from '@/types/common';
import { thisYear } from '@/utils/datetime';

import DashboardsPage, { generateMetadata } from './page';

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
  UPCOMING_SESSIONS: { title: 'UpcomingSessions', description: '' },
}));
vi.mock('./_components/UpcomingMatches', () => ({
  default: () => <div>UpcomingMatches</div>,
  UPCOMING_MATCHES: { title: 'UpcomingMatches', description: '' },
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

  const setup = async (range: DateRange = thisYear()) => {
    // `page`/`q` come from the shared params; the page forwards the window.
    mockLoadFilters.mockResolvedValue({ ...range, page: 1, q: '' });

    return renderWithUI(
      await DashboardsPage({ searchParams: Promise.resolve({}) } as never),
    );
  };

  setupTestLifecycle();

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Dashboard');
  });

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

  test('passes the loaded window to every analytics section', async () => {
    const range = { from: '2025-01-01', to: '2025-12-31' };
    await setup(range);

    expect(mockLoadFilters).toHaveBeenCalled();
    expect(propsSpy.matchesRate).toEqual({ range });
    expect(propsSpy.attendanceTrend).toEqual({ range });
    expect(propsSpy.ranking).toEqual({ range });
    expect(propsSpy.absence).toEqual({ range });
  });
});
