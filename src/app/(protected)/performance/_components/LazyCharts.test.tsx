import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import {
  AttendanceTrendChart,
  MatchStatsChart,
  TestProgressChart,
  TestRadarChart,
} from './LazyCharts';

// Each chart is a client-only dynamic chunk; stub the real recharts modules so
// the test asserts the lazy wiring rather than the charts themselves.
vi.mock('./attendance/AttendanceTrendChart', () => ({
  default: () => <div data-testid="attendance-trend" />,
}));
vi.mock('./testing/TestProgressChart', () => ({
  default: () => <div data-testid="test-progress" />,
}));
vi.mock('./testing/TestRadarChart', () => ({
  default: () => <div data-testid="test-radar" />,
}));
vi.mock('./matches/MatchStatsChart', () => ({
  default: () => <div data-testid="match-stats" />,
}));

describe('LazyCharts', () => {
  setupTestLifecycle();

  test('resolves AttendanceTrendChart to its chart', async () => {
    renderWithUI(<AttendanceTrendChart records={[]} subject="You" />);

    expect(await screen.findByTestId('attendance-trend')).toBeInTheDocument();
  });

  test('resolves TestProgressChart to its chart', async () => {
    renderWithUI(<TestProgressChart type={{} as never} subject="You" />);

    expect(await screen.findByTestId('test-progress')).toBeInTheDocument();
  });

  test('resolves TestRadarChart to its chart', async () => {
    renderWithUI(<TestRadarChart points={[]} />);

    expect(await screen.findByTestId('test-radar')).toBeInTheDocument();
  });

  test('resolves MatchStatsChart to its chart', async () => {
    renderWithUI(<MatchStatsChart records={[]} />);

    expect(await screen.findByTestId('match-stats')).toBeInTheDocument();
  });
});
