import { MOCK_ATTENDANCE_HISTORY } from '@/test/mocks/analytics';
import { renderWithUI, screen } from '@/test/utilities';

import type { AttendanceHistoryRecord } from '@/types/analytics';
import AttendanceTrend, { CustomTooltip } from './AttendanceTrend';

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

describe('CustomTooltip', () => {
  test('renders nothing when inactive', () => {
    const { container } = renderWithUI(
      <CustomTooltip active={false} payload={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing when there is no payload', () => {
    const { container } = renderWithUI(
      <CustomTooltip active payload={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('shows the present rate in green when it meets the target', () => {
    renderWithUI(
      <CustomTooltip
        active
        payload={[
          {
            payload: { present_rate: 85, attended: 17, total: 20 },
          } as never,
        ]}
      />,
    );

    const rate = screen.getByText('85%');
    expect(rate).toHaveStyle({ color: 'rgb(0, 128, 0)' });
    expect(screen.getByText(/17.*20/)).toBeInTheDocument();
  });

  test('shows the present rate in red when it misses the target', () => {
    renderWithUI(
      <CustomTooltip
        active
        payload={[
          {
            payload: { present_rate: 50, attended: 5, total: 10 },
          } as never,
        ]}
      />,
    );

    expect(screen.getByText('50%')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });
});
