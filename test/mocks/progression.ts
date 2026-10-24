import type { TestType } from '@/drizzle/schema';
import type {
  PlayerProgression,
  PlayerTypeProgression,
  TestNoteItem,
  TypeProgression,
} from '@/types/periodic-testing';
import { PerformanceBand, ProgressStatus, TestTypeUnit } from '@/utils/enum';

import { MOCK_TEAM } from './team';

export const MOCK_PROGRESSION_TYPE: TestType = {
  type_id: 'type-reps',
  team_id: MOCK_TEAM.team_id,
  name: 'Push-ups',
  unit: TestTypeUnit.REPS,
  higher_is_better: true,
  target: '40',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_PROGRESSION_TYPE_TIMED: TestType = {
  ...MOCK_PROGRESSION_TYPE,
  type_id: 'type-sprint',
  name: 'Sprint 30m',
  unit: TestTypeUnit.SECONDS,
  higher_is_better: false,
  target: null,
};

export const MOCK_PLAYER_PROGRESSION: PlayerProgression = {
  player_id: 'player-1',
  player_name: 'Alice',
  baseline: { date: '2026-01-01', result: 30 },
  latest: { date: '2026-03-01', result: 42 },
  best: { date: '2026-03-01', result: 42 },
  count: 3,
  change: 0.4,
  status: ProgressStatus.IMPROVING,
  band: PerformanceBand.ELITE,
  missed_latest: false,
};

export const MOCK_PLAYER_PROGRESSION_2: PlayerProgression = {
  player_id: 'player-2',
  player_name: 'Bob',
  baseline: { date: '2026-01-01', result: 35 },
  latest: { date: '2026-02-01', result: 30 },
  best: { date: '2026-01-01', result: 35 },
  count: 2,
  change: -0.14,
  status: ProgressStatus.REGRESSING,
  band: PerformanceBand.NEEDS_WORK,
  missed_latest: true,
};

export const MOCK_TYPE_PROGRESSION: TypeProgression = {
  type: MOCK_PROGRESSION_TYPE,
  latest_date: '2026-03-01',
  team_average: 36,
  team_best: 42,
  players: [MOCK_PLAYER_PROGRESSION, MOCK_PLAYER_PROGRESSION_2],
};

export const MOCK_PLAYER_TYPE_PROGRESSION: PlayerTypeProgression = {
  type: MOCK_PROGRESSION_TYPE,
  goal: 45,
  baseline: { date: '2026-01-01', result: 30 },
  latest: { date: '2026-03-01', result: 42 },
  best: { date: '2026-03-01', result: 42 },
  count: 3,
  change: 0.4,
  status: ProgressStatus.IMPROVING,
  band: PerformanceBand.ELITE,
  history: [
    { date: '2026-01-01', result: 30, team_average: 32 },
    { date: '2026-02-01', result: 35, team_average: 35 },
    { date: '2026-03-01', result: 42, team_average: 38 },
  ],
};

export const MOCK_TEST_NOTE: TestNoteItem = {
  note_id: 'note-1',
  content: 'Keep elbows tucked.',
  goal: 45,
  type_id: MOCK_PROGRESSION_TYPE.type_id,
  type_name: MOCK_PROGRESSION_TYPE.name,
  unit: MOCK_PROGRESSION_TYPE.unit,
  author_name: 'Coach Carter',
  created_at: new Date('2026-03-02'),
  outcome: 'pending',
};

export const MOCK_GENERAL_NOTE: TestNoteItem = {
  note_id: 'note-2',
  content: 'Great attitude.',
  goal: null,
  type_id: null,
  type_name: null,
  unit: null,
  author_name: null,
  created_at: new Date('2026-03-03'),
  outcome: null,
};
