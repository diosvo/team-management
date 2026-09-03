import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import {
  AbsenceReasonsBreakdown,
  AttendanceTrend,
  MatchesRate,
} from './LazyCharts';

// Each chart is a client-only dynamic chunk; stub the real recharts modules so
// the test asserts the lazy wiring rather than the charts themselves.
vi.mock('./MatchesRate', () => ({
  default: () => <div data-testid="matches-rate" />,
}));

vi.mock('./AttendanceTrend', () => ({
  default: () => <div data-testid="attendance-trend" />,
}));

vi.mock('./AbsenceReasonsBreakdown', () => ({
  default: () => <div data-testid="absence-reasons" />,
}));

describe('LazyCharts', () => {
  setupTestLifecycle();

  test('resolves MatchesRate to its chart', async () => {
    renderWithUI(<MatchesRate records={[]} />);

    expect(await screen.findByTestId('matches-rate')).toBeInTheDocument();
  });

  test('resolves AttendanceTrend to its chart', async () => {
    renderWithUI(<AttendanceTrend records={[]} />);

    expect(await screen.findByTestId('attendance-trend')).toBeInTheDocument();
  });

  test('resolves AbsenceReasonsBreakdown to its chart', async () => {
    renderWithUI(<AbsenceReasonsBreakdown reasons={[]} />);

    expect(await screen.findByTestId('absence-reasons')).toBeInTheDocument();
  });
});
