import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_ATTENDANCE_STATS } from '@/test/mocks/attendance';
import { axeInteractiveStat, renderWithUI, screen } from '@/test/utilities';

import { AttendanceStats as StatsType } from '@/types/attendance';
import { AttendanceStatus } from '@/utils/enum';

import AttendanceStats from './AttendanceStats';

describe('AttendanceStats', () => {
  const setSearchParams = vi.fn();

  const setup = (stats: StatsType = MOCK_ATTENDANCE_STATS) => {
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      {},
      setSearchParams,
    ]);

    return renderWithUI(<AttendanceStats stats={stats} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axeInteractiveStat(container);
    expect(result).toHaveNoViolations();
  });

  test('renders all stat cards with their labels', () => {
    setup();

    expect(screen.getByText('On Time')).toBeInTheDocument();
    expect(screen.getByText('Late Entry')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('Present Rate')).toBeInTheDocument();
  });

  test('renders the stat values', () => {
    setup();

    // on_time / late / absent are all 1 in the mock
    expect(screen.getAllByText('1')).toHaveLength(3);
    expect(
      screen.getByText(String(MOCK_ATTENDANCE_STATS.present_rate)),
    ).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  test('filters by On Time when its card is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('On Time'));

    expect(setSearchParams).toHaveBeenCalledWith({
      page: 1,
      q: '',
      status: [AttendanceStatus.ON_TIME],
    });
  });

  test('filters by Late when its card is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Late Entry'));

    expect(setSearchParams).toHaveBeenCalledWith({
      page: 1,
      q: '',
      status: [AttendanceStatus.LATE],
    });
  });

  test('filters by Absent when its card is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Absent'));

    expect(setSearchParams).toHaveBeenCalledWith({
      page: 1,
      q: '',
      status: [AttendanceStatus.ABSENT],
    });
  });

  test('present rate card is not clickable', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Present Rate'));

    expect(setSearchParams).not.toHaveBeenCalled();
  });

  test('does not filter when a stat card with a count of 0 is clicked', async () => {
    const { user } = setup({
      ...MOCK_ATTENDANCE_STATS,
      late_count: 0,
    });

    await user.click(screen.getByText('Late Entry'));

    expect(setSearchParams).not.toHaveBeenCalled();
  });
});
