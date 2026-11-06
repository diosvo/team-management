import {
  MOCK_PLAYER_TYPE_PROGRESSION,
  MOCK_PROGRESSION_TYPE_TIMED,
} from '@/test/mocks/progression';
import { renderWithUI, screen } from '@/test/utilities';

import TypeProgressionCard from './TypeProgressionCard';

vi.mock('./LazyProgressionChart', () => ({
  default: () => <div data-testid="chart" />,
}));

describe('TypeProgressionCard', () => {
  test('summarises a higher-is-better type', () => {
    renderWithUI(
      <TypeProgressionCard progression={MOCK_PLAYER_TYPE_PROGRESSION} />,
    );

    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('(higher is better)')).toBeInTheDocument();
    expect(screen.getByText(/Best 42 reps on/)).toHaveTextContent('3 tests');
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  test('summarises a lower-is-better type tested once', () => {
    renderWithUI(
      <TypeProgressionCard
        progression={{
          ...MOCK_PLAYER_TYPE_PROGRESSION,
          type: MOCK_PROGRESSION_TYPE_TIMED,
          count: 1,
        }}
      />,
    );

    expect(screen.getByText('(lower is better)')).toBeInTheDocument();
    expect(screen.getByText(/Best/)).toHaveTextContent('1 test');
  });
});
