import { Mock } from 'vitest';

import {
  MOCK_ABSENCE_REASONS,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_PLAYERS_ATTENDANCE_SUMMARY,
} from '@/test/mocks/analytics';
import { renderWithUI, screen } from '@/test/utilities';

import {
  getAttendanceHistory,
  getAttendanceSummary,
  getMatchesRate,
  getMostAbsenceReasons,
} from '@/actions/analytics';
import { loadDashboardFilters } from '@/lib/nuqs';
import { Interval } from '@/utils/enum';

import DashboardsPage from './page';

vi.mock('@/actions/analytics', () => ({
  getAttendanceHistory: vi.fn(),
  getAttendanceSummary: vi.fn(),
  getMatchesRate: vi.fn(),
  getMostAbsenceReasons: vi.fn(),
}));

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
vi.mock('./_components/MatchesRate', () => ({
  default: (props: unknown) => {
    propsSpy.matchesRate = props;
    return <div>MatchesRate</div>;
  },
}));
vi.mock('./_components/AttendanceTrend', () => ({
  default: (props: unknown) => {
    propsSpy.attendanceTrend = props;
    return <div>AttendanceTrend</div>;
  },
}));
vi.mock('./_components/PlayerAttendanceRanking', () => ({
  default: (props: unknown) => {
    propsSpy.ranking = props;
    return <div>PlayerAttendanceRanking</div>;
  },
}));
vi.mock('./_components/AbsenceReasonsBreakdown', () => ({
  default: (props: unknown) => {
    propsSpy.absence = props;
    return <div>AbsenceReasonsBreakdown</div>;
  },
}));

describe('DashboardsPage', () => {
  const mockLoadFilters = loadDashboardFilters as unknown as Mock;
  const mockMatchesRate = getMatchesRate as unknown as Mock;
  const mockAttendanceHistory = getAttendanceHistory as unknown as Mock;
  const mockAttendanceSummary = getAttendanceSummary as unknown as Mock;
  const mockAbsenceReasons = getMostAbsenceReasons as unknown as Mock;

  const MOCK_MATCHES_RATE = [{ outcome: 'win', league: 3, friendly: 2 }];

  const setup = async (interval = Interval.THIS_YEAR) => {
    mockLoadFilters.mockResolvedValue({ interval });
    mockMatchesRate.mockResolvedValue(MOCK_MATCHES_RATE);
    mockAttendanceHistory.mockResolvedValue(MOCK_ATTENDANCE_HISTORY);
    mockAttendanceSummary.mockResolvedValue(MOCK_PLAYERS_ATTENDANCE_SUMMARY);
    mockAbsenceReasons.mockResolvedValue(MOCK_ABSENCE_REASONS);

    return renderWithUI(
      await DashboardsPage({ searchParams: Promise.resolve({}) } as never),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
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

  test('fetches analytics data using the loaded interval', async () => {
    await setup(Interval.LAST_YEAR);

    expect(mockLoadFilters).toHaveBeenCalled();
    expect(mockMatchesRate).toHaveBeenCalledWith(Interval.LAST_YEAR);
    expect(mockAttendanceHistory).toHaveBeenCalledWith(Interval.LAST_YEAR);
    expect(mockAttendanceSummary).toHaveBeenCalledWith(Interval.LAST_YEAR);
    expect(mockAbsenceReasons).toHaveBeenCalledWith(Interval.LAST_YEAR);
  });

  test('passes the fetched data to the analytics components', async () => {
    await setup();

    expect(propsSpy.matchesRate).toEqual({ records: MOCK_MATCHES_RATE });
    expect(propsSpy.attendanceTrend).toEqual({
      records: MOCK_ATTENDANCE_HISTORY,
    });
    expect(propsSpy.ranking).toEqual({
      records: MOCK_PLAYERS_ATTENDANCE_SUMMARY,
    });
    expect(propsSpy.absence).toEqual({ reasons: MOCK_ABSENCE_REASONS });
  });
});
