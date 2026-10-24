import { MOCK_PLAYER_TYPE_PROGRESSION } from '@/test/mocks/progression';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import LazyProgressionChart from './LazyProgressionChart';

// Stub the recharts module so the test asserts the lazy wiring only.
vi.mock('./ProgressionChart', () => ({
  default: () => <div data-testid="progression-chart" />,
}));

describe('LazyProgressionChart', () => {
  setupTestLifecycle();

  test('resolves to the progression chart', async () => {
    renderWithUI(
      <LazyProgressionChart progression={MOCK_PLAYER_TYPE_PROGRESSION} />,
    );

    expect(await screen.findByTestId('progression-chart')).toBeInTheDocument();
  });
});
