import { ActivityKind, MatchResult, PlayerPosition } from '@/utils/enum';

import type {
  ActivityRecord,
  AttendanceOverview,
  MatchesOverview,
  MatchPerformanceRecord,
  PerformanceIdentity,
  PerformanceSummary,
  TestTypeProgress,
} from '@/types/performance';

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

export const MOCK_ACTIVITY_RECORDS: Array<ActivityRecord> = [
  {
    id: 'training-1',
    kind: ActivityKind.TRAINING,
    date: '2026-03-02',
    location: 'Main Gym',
    duration_hours: 2,
    status: 'late',
    reason: 'Traffic',
  },
  {
    id: 'training-2',
    kind: ActivityKind.TRAINING,
    date: '2026-03-04',
    location: null,
    duration_hours: null,
    status: 'on_time',
    reason: null,
  },
  {
    id: 'training-3',
    kind: ActivityKind.TRAINING,
    date: '2026-03-06',
    location: 'Court B',
    duration_hours: null,
    status: null,
    reason: null,
  },
  {
    id: 'test-1',
    kind: ActivityKind.TEST,
    date: '2026-03-08',
    results: [
      { name: 'Sprint', result: 12.3, unit: 'seconds' },
      { name: 'Shooting', result: 85, unit: 'percent' },
      { name: 'Jump', result: 4.2, unit: 'meters' },
      { name: 'Push-ups', result: 30, unit: 'reps' },
    ],
  },
  {
    id: 'match-1',
    kind: ActivityKind.MATCH,
    date: '2026-03-10',
    opponent: 'Tigers',
    result: 'win',
    score: '80-72',
    points_scored: 18,
    rebounds: 6,
    assists: 4,
  },
];

export const MOCK_PERFORMANCE_SUMMARY: PerformanceSummary = {
  attendance: {
    rate: 75,
    total: 8,
    on_time: 5,
    late: 1,
    current_streak: 3,
    best_streak: 5,
  },
  tests_taken: 2,
  last_tested: '2026-03-15',
  honors: { count: 1, latest: { type: 'mvp', year: 2026 } },
};

export const MOCK_ATTENDANCE_OVERVIEW: AttendanceOverview = {
  total: 10,
  on_time: 6,
  late: 2,
  absent: 2,
  rate: 80,
  team_rate: 72.5,
  current_streak: 2,
  best_streak: 4,
  trend: { recent: 90, previous: 70, delta: 20 },
  monthly: [{ month: '2026-01', player: 80, team: 72.5 }],
  reasons: [
    { name: 'Sick', count: 2 },
    { name: null, count: 1 },
  ],
};

export const MOCK_EMPTY_ATTENDANCE_OVERVIEW: AttendanceOverview = {
  total: 0,
  on_time: 0,
  late: 0,
  absent: 0,
  rate: 0,
  team_rate: 0,
  current_streak: 0,
  best_streak: 0,
  trend: null,
  monthly: [],
  reasons: [],
};
