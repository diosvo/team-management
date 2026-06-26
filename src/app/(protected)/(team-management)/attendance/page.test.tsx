import { axe } from 'jest-axe';

import {
  MOCK_ATTENDANCE_DATE,
  MOCK_ATTENDANCE_RESPONSE,
  MOCK_ATTENDANCE_STATS,
} from '@/test/mocks/attendance';
import { renderWithUI, screen } from '@/test/utilities';

import { getAttendanceByDate } from '@/actions/attendance';
import { loadAttendanceFilters } from '@/lib/nuqs';

import { AttendanceStatus } from '@/utils/enum';
import AttendancePage, { metadata } from './page';

vi.mock('@/actions/attendance', () => ({
  getAttendanceByDate: vi.fn(),
}));

vi.mock('@/lib/nuqs', () => ({
  loadAttendanceFilters: vi.fn(),
}));

// The page is only responsible for wiring data into them, so each stub surfaces the props it receives.
vi.mock('./_components/AttendanceHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/AttendanceFilters', () => ({
  default: () => <div data-testid="filters" />,
}));
vi.mock('./_components/AttendanceStats', () => ({
  default: ({ stats }: { stats: { present_rate: number } }) => (
    <div data-testid="stats">{stats.present_rate}</div>
  ),
}));
vi.mock('./_components/AttendanceTable', () => ({
  default: ({ attendances }: { attendances: Array<unknown> }) => (
    <div data-testid="table">{attendances.length}</div>
  ),
}));

describe('AttendancePage', () => {
  const mockLoadFilters = vi.mocked(loadAttendanceFilters);
  const mockGetAttendance = vi.mocked(getAttendanceByDate);

  const setup = async (searchParams: Record<string, unknown> = {}) => {
    const searchParamsPromise = Promise.resolve(searchParams);
    const props = {
      params: Promise.resolve({}),
      searchParams: searchParamsPromise,
    } as Parameters<typeof AttendancePage>[0];

    const ui = await AttendancePage(props);

    return { ...renderWithUI(ui), searchParamsPromise };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFilters.mockResolvedValue({
      q: '',
      page: 1,
      date: MOCK_ATTENDANCE_DATE,
      status: [],
    });
    mockGetAttendance.mockResolvedValue(MOCK_ATTENDANCE_RESPONSE);
  });

  test('exposes page metadata', () => {
    expect(metadata.title).toBe('Attendance');
    expect(metadata.description).toBe(
      'Manage and view team attendance information.',
    );
  });

  test('should be accessible', async () => {
    const { container } = await setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders every section in order', async () => {
    await setup();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toBeInTheDocument();
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  test('loads filters from the incoming search params', async () => {
    const searchParams = {
      date: '2026-03-15',
      status: [AttendanceStatus.ABSENT],
    };
    const { searchParamsPromise } = await setup(searchParams);

    expect(mockLoadFilters).toHaveBeenCalledWith(searchParamsPromise);
  });

  test('fetches attendance for the resolved date', async () => {
    await setup();

    expect(mockGetAttendance).toHaveBeenCalledWith(MOCK_ATTENDANCE_DATE);
  });

  test('passes the fetched stats to the stats section', async () => {
    await setup();

    expect(screen.getByTestId('stats')).toHaveTextContent(
      String(MOCK_ATTENDANCE_STATS.present_rate),
    );
  });

  test('passes the fetched records to the table', async () => {
    await setup();

    expect(screen.getByTestId('table')).toHaveTextContent(
      String(MOCK_ATTENDANCE_RESPONSE.data.length),
    );
  });
});
