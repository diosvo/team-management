import { renderWithUI } from '@/test/utilities';

import TestRadarChart from './TestRadarChart';

describe('TestRadarChart', () => {
  test('renders the radar for the given points', () => {
    const { container } = renderWithUI(
      <TestRadarChart
        points={[
          { name: 'Sprint', percentile: 80 },
          { name: 'Jump', percentile: 40 },
          { name: 'Plank', percentile: 60 },
        ]}
      />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
