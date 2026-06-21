import { MOCK_ATTENDANCE_HISTORY } from '@/test/mocks/analytics';
import { renderWithUI, screen } from '@/test/utilities';

import { AttendanceHistoryRecord } from '@/types/analytics';
import AttendanceTrend from './AttendanceTrend';

describe('AttendanceTrend', () => {
  const setup = (records: Array<AttendanceHistoryRecord>) =>
    renderWithUI(<AttendanceTrend records={records} />);

  test('renders the card title', () => {
    setup(MOCK_ATTENDANCE_HISTORY);

    expect(screen.getByText('Attendance Rate Trend')).toBeInTheDocument();
    expect(
      screen.getByText(/Overall team attendance percentage/),
    ).toBeInTheDocument();
  });

  test('renders the empty state when there are no records', () => {
    setup([]);

    expect(screen.getByText('No attendance records')).toBeInTheDocument();
  });

  test('renders the average attendance rate in the description', () => {
    setup(MOCK_ATTENDANCE_HISTORY);
    // (100 + 83 + 67) / 3 = 83.33...
    expect(screen.getByText('83.3%')).toBeInTheDocument();
  });

  test('does not render the average rate when there are no records', () => {
    setup([]);

    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });
});
