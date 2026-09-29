import { renderWithUI } from '@/test/utilities';

import type { MatchPerformanceRecord } from '@/types/performance';
import MatchStatsChart from './MatchStatsChart';

const RECORD: MatchPerformanceRecord = {
  match_id: 'match-1',
  date: '2026-08-08',
  opponent: 'Rivals',
  result: 'win',
  score: '80 - 70',
  points_scored: 12,
  rebounds: 5,
  assists: 3,
  steals: 1,
  blocks: 0,
  turnovers: 2,
  fouls: 3,
  minutes_played: 25,
};

describe('MatchStatsChart', () => {
  test('renders the chart for the given records', () => {
    const { container } = renderWithUI(<MatchStatsChart records={[RECORD]} />);

    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders with no records', () => {
    const { container } = renderWithUI(<MatchStatsChart records={[]} />);

    expect(container.firstChild).toBeInTheDocument();
  });
});
