import { renderWithUI } from '@/test/utilities';

import type { TestTypeProgress } from '@/types/performance';
import TestProgressChart from './TestProgressChart';

const TYPE: TestTypeProgress = {
  type_id: 'type-1',
  name: 'Sprint',
  unit: 'seconds',
  lower_is_better: true,
  latest: {
    date: '2026-08-08',
    result: 12,
    previous: 13,
    improvement_pct: 7.7,
    team_avg: 12.5,
    percentile: 60,
    team_size: 5,
  },
  series: [
    { date: '2026-07-08', result: 13, team_avg: null },
    { date: '2026-08-08', result: 12, team_avg: 12.5 },
  ],
};

describe('TestProgressChart', () => {
  test('renders the progress chart in English', () => {
    const { container } = renderWithUI(
      <TestProgressChart type={TYPE} subject="You" />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders the progress chart in Vietnamese', () => {
    const { container } = renderWithUI(
      <TestProgressChart type={TYPE} subject="Bạn" />,
      { locale: 'vi' },
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
