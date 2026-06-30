import { axe } from 'jest-axe';

import { MOCK_MATCH_RESPONSE } from '@/test/mocks/match';
import { renderWithUI, screen } from '@/test/utilities';

import { MatchStats as StatsType } from '@/types/match';

import MatchStats from './MatchStats';

describe('MatchStats', () => {
  const setup = (overrides: Partial<StatsType> = {}) =>
    renderWithUI(
      <MatchStats stats={{ ...MOCK_MATCH_RESPONSE.stats, ...overrides }} />,
    );

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders all stat cards with their labels', () => {
    setup();

    expect(screen.getByText('Total Matches')).toBeInTheDocument();
    expect(screen.getByText('Win Streak')).toBeInTheDocument();
    expect(screen.getByText('Avg Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Points/Game')).toBeInTheDocument();
  });

  test('renders the stat values', () => {
    setup();

    // total_matches: 2, win_streak: 1, avg_win_rate: 50, avg_points_per_game: 84.5
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('84.5')).toBeInTheDocument();
  });

  test('pluralizes the games unit based on the value', () => {
    setup({ total_matches: 2, win_streak: 1 });

    expect(screen.getByText('games')).toBeInTheDocument(); // total_matches: 2
    expect(screen.getByText('game')).toBeInTheDocument(); // win_streak: 1
  });

  test('renders symbol and abbreviation units verbatim', () => {
    setup();

    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText('pts')).toBeInTheDocument();
  });
});
