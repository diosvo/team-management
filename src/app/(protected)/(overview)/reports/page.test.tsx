import { MOCK_REPORT_HISTORY, MOCK_REPORT_SCHEDULE } from '@/test/mocks/report';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { getReportHistory, getReportSchedules } from '@/actions/report';
import type { ReportHistory, ReportSchedule } from '@/drizzle/schema';

import ReportsPage, { generateMetadata } from './page';

vi.mock('@/actions/report', () => ({
  getReportSchedules: vi.fn(),
  getReportHistory: vi.fn(),
}));

// Child components are covered by their own tests; render lightweight markers
// here and capture the props the page wires through to them.
const propsSpy = {
  schedules: undefined as unknown,
  history: undefined as unknown,
};

vi.mock('./_components/ReportSchedules', () => ({
  default: (props: unknown) => {
    propsSpy.schedules = props;
    return <div>ReportSchedules</div>;
  },
}));
vi.mock('./_components/ReportHistory', () => ({
  default: (props: unknown) => {
    propsSpy.history = props;
    return <div>ReportHistory</div>;
  },
}));

describe('ReportsPage', () => {
  const mockGetReportSchedules = vi.mocked(getReportSchedules);
  const mockGetReportHistory = vi.mocked(getReportHistory);

  const setup = async ({
    schedules = [MOCK_REPORT_SCHEDULE],
    history = [MOCK_REPORT_HISTORY],
  }: Partial<{
    schedules: Array<ReportSchedule>;
    history: Array<ReportHistory>;
  }> = {}) => {
    mockGetReportSchedules.mockResolvedValue(schedules);
    mockGetReportHistory.mockResolvedValue(history);

    return renderWithUI(await ReportsPage());
  };

  setupTestLifecycle();

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Reports');
  });

  test('renders the schedules and history sections', async () => {
    await setup();

    expect(screen.getByText('ReportSchedules')).toBeInTheDocument();
    expect(screen.getByText('ReportHistory')).toBeInTheDocument();
  });

  test('fetches the schedules and the history', async () => {
    await setup();

    expect(mockGetReportSchedules).toHaveBeenCalled();
    expect(mockGetReportHistory).toHaveBeenCalled();
  });

  test('passes the fetched data to each section', async () => {
    await setup();

    expect(propsSpy.schedules).toEqual({ schedules: [MOCK_REPORT_SCHEDULE] });
    expect(propsSpy.history).toEqual({ history: [MOCK_REPORT_HISTORY] });
  });

  test('renders both sections when there is no data yet', async () => {
    await setup({ schedules: [], history: [] });

    expect(propsSpy.schedules).toEqual({ schedules: [] });
    expect(propsSpy.history).toEqual({ history: [] });
  });
});
