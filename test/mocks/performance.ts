import type {
  MatchesOverview,
  MatchPerformanceRecord,
  PerformanceIdentity,
  TestTypeProgress,
} from '@/types/performance';
import { MatchResult, PlayerPosition } from '@/utils/enum';

export const MOCK_PERFORMANCE_TARGET_ID = 'player-1';
export const MOCK_PERFORMANCE_RANGE = { from: '2026-01-01', to: '2026-12-31' };

/** A captain viewing their own page. */
export const MOCK_PERFORMANCE_IDENTITY: PerformanceIdentity = {
  id: MOCK_PERFORMANCE_TARGET_ID,
  name: 'Jane Doe',
  is_own: true,
  is_player: true,
  is_captain: true,
  jersey_number: 7,
  position: PlayerPosition.CENTER,
};

/** The `index`-th win of August 2026; points scored equal the index. */
export const createMatchRecord = (index: number): MatchPerformanceRecord => ({
  match_id: `match-${index}`,
  date: `2026-08-${String(index).padStart(2, '0')}`,
  opponent: `Opponent ${index}`,
  result: MatchResult.WIN,
  score: `${80 + index} - 70`,
  points_scored: index,
  rebounds: 5,
  assists: 3,
  steals: 1,
  blocks: 0,
  turnovers: 2,
  fouls: 3,
});

export const MOCK_MATCH_AVERAGES: MatchesOverview['averages'] = {
  points_scored: 12.5,
  rebounds: 5,
  assists: 3,
  steals: 1,
  blocks: 0,
  turnovers: 2,
};

export const createTestType = (
  name: string,
  latest: Partial<TestTypeProgress['latest']> = {},
  overrides: Partial<TestTypeProgress> = {},
): TestTypeProgress => ({
  type_id: `type-${name}`,
  name,
  unit: 'seconds',
  lower_is_better: false,
  latest: {
    date: '2026-08-08',
    result: 10,
    improvement_pct: 5,
    team_avg: 9.5,
    percentile: 50,
    ...latest,
  },
  series: [],
  ...overrides,
});
