import { createTestType } from '@/test/mocks/performance';
import { renderWithUI } from '@/test/utilities';

import TestProgressChart from './TestProgressChart';

const TYPE = createTestType(
  'Sprint',
  { result: 12, improvement_pct: 7.7, team_avg: 12.5, percentile: 60 },
  {
    lower_is_better: true,
    series: [
      { date: '2026-07-08', result: 13, team_avg: null },
      { date: '2026-08-08', result: 12, team_avg: 12.5 },
    ],
  },
);

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
