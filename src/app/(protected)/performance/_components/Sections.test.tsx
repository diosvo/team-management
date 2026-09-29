import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import {
  getPlayerActivity,
  getPlayerAttendance,
  getPlayerMatches,
  getPlayerTesting,
} from '@/actions/player-performance';

import {
  ActivitySection,
  AttendanceSection,
  MatchesSection,
  TestingSection,
} from './Sections';

vi.mock('@/actions/player-performance', () => ({
  getPlayerActivity: vi.fn(),
  getPlayerAttendance: vi.fn(),
  getPlayerMatches: vi.fn(),
  getPlayerTesting: vi.fn(),
}));

// Each overview is covered by its own test; capture the props each section
// resolves and passes down.
const propsSpy = {
  activity: undefined as unknown,
  attendance: undefined as unknown,
  matches: undefined as unknown,
  testing: undefined as unknown,
};

vi.mock('./activity/ActivityTable', () => ({
  default: (props: unknown) => {
    propsSpy.activity = props;
    return <div>ActivityTable</div>;
  },
}));
vi.mock('./attendance/AttendanceOverview', () => ({
  default: (props: unknown) => {
    propsSpy.attendance = props;
    return <div>AttendanceOverview</div>;
  },
}));
vi.mock('./matches/MatchPerformance', () => ({
  default: (props: unknown) => {
    propsSpy.matches = props;
    return <div>MatchPerformance</div>;
  },
}));
vi.mock('./testing/TestingOverview', () => ({
  default: (props: unknown) => {
    propsSpy.testing = props;
    return <div>TestingOverview</div>;
  },
}));

const TARGET_ID = 'player-1';
const RANGE = { from: '2026-01-01', to: '2026-12-31' };

describe('Sections', () => {
  setupTestLifecycle();

  test('AttendanceSection fetches the period and passes the subject', async () => {
    const data = { total: 3 };
    vi.mocked(getPlayerAttendance).mockResolvedValue(data as never);

    renderWithUI(
      await AttendanceSection({
        target_id: TARGET_ID,
        range: RANGE,
        subject: 'You',
      }),
    );

    expect(getPlayerAttendance).toHaveBeenCalledWith(TARGET_ID, RANGE);
    expect(screen.getByText('AttendanceOverview')).toBeInTheDocument();
    expect(propsSpy.attendance).toEqual({ data, subject: 'You' });
  });

  test('TestingSection fetches every test and passes the subject', async () => {
    const data = { types: [] };
    vi.mocked(getPlayerTesting).mockResolvedValue(data as never);

    renderWithUI(
      await TestingSection({ target_id: TARGET_ID, subject: 'Jane' }),
    );

    expect(getPlayerTesting).toHaveBeenCalledWith(TARGET_ID);
    expect(screen.getByText('TestingOverview')).toBeInTheDocument();
    expect(propsSpy.testing).toEqual({ data, subject: 'Jane' });
  });

  test('ActivitySection fetches the period records', async () => {
    const records = [{ id: '1' }];
    vi.mocked(getPlayerActivity).mockResolvedValue(records as never);

    renderWithUI(await ActivitySection({ target_id: TARGET_ID, range: RANGE }));

    expect(getPlayerActivity).toHaveBeenCalledWith(TARGET_ID, RANGE);
    expect(screen.getByText('ActivityTable')).toBeInTheDocument();
    expect(propsSpy.activity).toEqual({ records });
  });

  test('MatchesSection fetches the period box scores', async () => {
    const data = { records: [] };
    vi.mocked(getPlayerMatches).mockResolvedValue(data as never);

    renderWithUI(await MatchesSection({ target_id: TARGET_ID, range: RANGE }));

    expect(getPlayerMatches).toHaveBeenCalledWith(TARGET_ID, RANGE);
    expect(screen.getByText('MatchPerformance')).toBeInTheDocument();
    expect(propsSpy.matches).toEqual({ data });
  });
});
