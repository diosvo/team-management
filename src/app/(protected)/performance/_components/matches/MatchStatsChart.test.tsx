import { createMatchRecord } from '@/test/mocks/performance';
import { renderWithUI } from '@/test/utilities';

import MatchStatsChart from './MatchStatsChart';

describe('MatchStatsChart', () => {
  test('renders the chart for the given records', () => {
    const { container } = renderWithUI(
      <MatchStatsChart records={[createMatchRecord(8)]} />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders with no records', () => {
    const { container } = renderWithUI(<MatchStatsChart records={[]} />);

    expect(container.firstChild).toBeInTheDocument();
  });
});
