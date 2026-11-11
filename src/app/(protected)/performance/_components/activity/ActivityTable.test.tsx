import { formatDate, formatDay } from '@/utils/datetime';
import { ActivityKind } from '@/utils/enum';

import {
  MOCK_ACTIVITY_RECORDS,
  MOCK_PERFORMANCE_RANGE,
} from '@/test/mocks/performance';
import {
  enumText,
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  within,
} from '@/test/utilities';
import type { ActivityRecord } from '@/types/performance';

import ActivityTable from './ActivityTable';

describe('ActivityTable', () => {
  const mockSetSearchParams = vi.fn();

  setupTestLifecycle();

  const setup = (
    kind: Array<ActivityKind> = [],
    records: Array<ActivityRecord> = MOCK_ACTIVITY_RECORDS,
  ) => {
    mockUseQueryStates(
      { ...MOCK_PERFORMANCE_RANGE, kind, page: 1 },
      mockSetSearchParams,
    );

    return renderWithUI(<ActivityTable records={records} />);
  };

  const row = (text: string) =>
    screen.getByText(text).closest('tr') as HTMLElement;

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the card and the column headers', () => {
    setup();

    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    for (const name of ['Date', 'Type', 'Details', 'Outcome']) {
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('columnheader', { name: 'Activity' }),
    ).not.toBeInTheDocument();
  });

  test('hides the type column once a single kind is picked', () => {
    setup(['match']);

    expect(
      screen.queryByRole('columnheader', { name: 'Type' }),
    ).not.toBeInTheDocument();
  });

  test('shows the full weekday next to the date', () => {
    setup();

    expect(
      within(row('Main Gym · 2h')).getByText(formatDay('2026-03-02', 'EEE')),
    ).toBeInTheDocument();
  });

  test('describes a training session with its attendance', () => {
    setup();

    const training = row('Main Gym · 2h');
    expect(within(training).getByText('Training')).toBeInTheDocument();
    expect(within(training).getByText(formatDate('2026-03-02'))).toBeVisible();
    expect(
      within(training).getByText(enumText('attendanceStatus', 'late')),
    ).toBeInTheDocument();
  });

  test('shows the status without a reason and an unrecorded status', () => {
    setup();

    expect(
      within(row(formatDate('2026-03-04'))).getByText(
        enumText('attendanceStatus', 'on_time'),
      ),
    ).toBeInTheDocument();
    expect(
      within(row('Court B')).getByText('Not recorded'),
    ).toBeInTheDocument();
  });

  test('summarises every test result with its unit', () => {
    setup();

    expect(
      within(row('4 test types')).getByText(
        'Sprint 12.3s · Shooting 85% · Jump 4.2m · Push-ups 30',
      ),
    ).toBeInTheDocument();
  });

  test('summarises a match with the box score', () => {
    setup();

    const match = row(`vs Tigers · ${enumText('matchResult', 'win')} · 80-72`);
    expect(within(match).getByText('Match')).toBeInTheDocument();
    expect(
      within(match).getByText('18 PTS · 6 REB · 4 AST'),
    ).toBeInTheDocument();
  });

  test('lists only the records of the picked kind', () => {
    setup(['match']);

    expect(screen.getByText('18 PTS · 6 REB · 4 AST')).toBeInTheDocument();
    expect(screen.queryByText('Main Gym · 2h')).not.toBeInTheDocument();
    expect(screen.queryByText('4 test types')).not.toBeInTheDocument();
  });

  test('writes the picked kind to the URL and resets the page', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Fitness tests'));

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      kind: [ActivityKind.TEST],
      page: 1,
    });
  });

  test('clears the kind when "All" is picked', async () => {
    const { user } = setup(['match']);

    await user.click(screen.getByText('All'));

    expect(mockSetSearchParams).toHaveBeenCalledWith({ kind: [], page: 1 });
  });

  test('renders the empty state when there is no activity', () => {
    setup([], []);

    expect(screen.getByText('No activity in this period')).toBeInTheDocument();
    expect(
      screen.getByText('Try another time range or activity type.'),
    ).toBeInTheDocument();
  });
});
