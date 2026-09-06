
import {
  MOCK_ABSENCE_REASONS,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_PLAYERS_ATTENDANCE_SUMMARY,
} from '@/test/mocks/analytics';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import {
  getAttendanceHistory,
  getAttendanceSummary,
  getMatchesRate,
  getMostAbsenceReasons,
} from '@/actions/analytics';
import { Interval } from '@/utils/enum';

import {
  AbsenceReasonsBreakdownSection,
  AttendanceTrendSection,
  MatchesRateSection,
  PlayerAttendanceRankingSection,
} from './AnalyticsSections';

vi.mock('@/actions/analytics', () => ({
  getAttendanceHistory: vi.fn(),
  getAttendanceSummary: vi.fn(),
  getMatchesRate: vi.fn(),
  getMostAbsenceReasons: vi.fn(),
}));

// The charts are covered by their own tests; capture the props each section
// resolves and passes down.
const propsSpy = {
  matchesRate: undefined as unknown,
  attendanceTrend: undefined as unknown,
  ranking: undefined as unknown,
  absence: undefined as unknown,
};

vi.mock('./LazyCharts', () => ({
  MatchesRate: (props: unknown) => {
    propsSpy.matchesRate = props;
    return <div>MatchesRate</div>;
  },
  AttendanceTrend: (props: unknown) => {
    propsSpy.attendanceTrend = props;
    return <div>AttendanceTrend</div>;
  },
  AbsenceReasonsBreakdown: (props: unknown) => {
    propsSpy.absence = props;
    return <div>AbsenceReasonsBreakdown</div>;
  },
}));
vi.mock('./PlayerAttendanceRanking', () => ({
  default: (props: unknown) => {
    propsSpy.ranking = props;
    return <div>PlayerAttendanceRanking</div>;
  },
}));

const INTERVAL = Interval.LAST_YEAR;

describe('AnalyticsSections', () => {
  setupTestLifecycle();

  test('MatchesRateSection fetches by interval and passes records', async () => {
    const MOCK_MATCHES_RATE = [{ outcome: 'win', league: 3, friendly: 2 }];
    (vi.mocked(getMatchesRate)).mockResolvedValue(MOCK_MATCHES_RATE);

    renderWithUI(await MatchesRateSection({ interval: INTERVAL }));

    expect(getMatchesRate).toHaveBeenCalledWith(INTERVAL);
    expect(screen.getByText('MatchesRate')).toBeInTheDocument();
    expect(propsSpy.matchesRate).toEqual({ records: MOCK_MATCHES_RATE });
  });

  test('AttendanceTrendSection fetches by interval and passes records', async () => {
    (vi.mocked(getAttendanceHistory)).mockResolvedValue(
      MOCK_ATTENDANCE_HISTORY,
    );

    renderWithUI(await AttendanceTrendSection({ interval: INTERVAL }));

    expect(getAttendanceHistory).toHaveBeenCalledWith(INTERVAL);
    expect(propsSpy.attendanceTrend).toEqual({
      records: MOCK_ATTENDANCE_HISTORY,
    });
  });

  test('PlayerAttendanceRankingSection fetches by interval and passes records', async () => {
    (vi.mocked(getAttendanceSummary)).mockResolvedValue(
      MOCK_PLAYERS_ATTENDANCE_SUMMARY,
    );

    renderWithUI(await PlayerAttendanceRankingSection({ interval: INTERVAL }));

    expect(getAttendanceSummary).toHaveBeenCalledWith(INTERVAL);
    expect(propsSpy.ranking).toEqual({
      records: MOCK_PLAYERS_ATTENDANCE_SUMMARY,
    });
  });

  test('AbsenceReasonsBreakdownSection fetches by interval and passes reasons', async () => {
    (vi.mocked(getMostAbsenceReasons)).mockResolvedValue(
      MOCK_ABSENCE_REASONS,
    );

    renderWithUI(await AbsenceReasonsBreakdownSection({ interval: INTERVAL }));

    expect(getMostAbsenceReasons).toHaveBeenCalledWith(INTERVAL);
    expect(propsSpy.absence).toEqual({ reasons: MOCK_ABSENCE_REASONS });
  });
});
