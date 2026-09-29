import type { ComponentProps } from 'react';

import { renderWithUI, screen } from '@/test/utilities';

import type { MonthlyAttendance } from '@/types/performance';

import AttendanceTrendChart from './AttendanceTrendChart';

// jsdom has no layout, so a responsive chart never measures a size and draws
// nothing; give it a fixed one so the axes and their ticks render.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    LineChart: (props: ComponentProps<typeof actual.LineChart>) => (
      <actual.LineChart
        {...props}
        responsive={false}
        width={600}
        height={300}
      />
    ),
  };
});

const RECORDS: Array<MonthlyAttendance> = [
  { month: '2026-01', player: 80, team: 75 },
  { month: '2026-02', player: null, team: 70 },
];

describe('AttendanceTrendChart', () => {
  test('renders the trend chart in English', () => {
    const { container } = renderWithUI(
      <AttendanceTrendChart records={RECORDS} subject="You" />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders the trend chart in Vietnamese', () => {
    const { container } = renderWithUI(
      <AttendanceTrendChart records={RECORDS} subject="Bạn" />,
      { locale: 'vi' },
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  test('labels the Y axis as percentages', () => {
    renderWithUI(<AttendanceTrendChart records={RECORDS} subject="You" />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
