import type { PerformanceBand, ProgressStatus } from '@/utils/enum';
import type { GoalOutcome } from '@/utils/progression';

import type { PlayerOption } from '@/db/user';
import type { TestType } from '@/drizzle/schema';

export interface PlayerTestResult {
  player_id: string;
  player_name: string;
  // Keyed by test type name. Each cell carries its own `result_id` so an
  // inline edit updates the correct player/type row.
  tests: Record<string, { result_id: string; result: string }>;
}

export interface TestResult {
  // `type_id` lets an inline edit on an empty cell create the missing result.
  headers: Array<{ type_id: string; name: string; unit: string }>;
  players: Array<PlayerTestResult>;
}

export interface TestFilters {
  search: string;
  date: string;
}

export interface TestConfigurationSelection {
  players: Array<PlayerOption>;
  types: Array<TestType>;
  date: string;
}

export interface TestPoint {
  date: string;
  result: number;
}

export interface ProgressionSummary {
  baseline: TestPoint;
  latest: TestPoint;
  best: TestPoint;
  count: number;
  // Baseline → latest, signed so a positive value is always an improvement.
  change: number;
  status: ProgressStatus;
  band: Nullable<PerformanceBand>;
}

export interface PlayerProgression extends ProgressionSummary {
  player_id: string;
  player_name: string;
  // Tested before but absent from the team's most recent test of this type.
  missed_latest: boolean;
}

export interface TypeProgression {
  type: TestType;
  latest_date: Nullable<string>;
  // Benchmarks taken from each player's latest result.
  team_average: Nullable<number>;
  team_best: Nullable<number>;
  players: Array<PlayerProgression>;
}

export interface PlayerTypeProgression extends ProgressionSummary {
  type: TestType;
  // The coach's goal for the next test, from this type's note.
  goal: Nullable<number>;
  history: Array<TestPoint & { team_average: number }>;
}

export interface TestNoteItem {
  note_id: string;
  content: string;
  goal: Nullable<number>;
  type_id: Nullable<string>;
  type_name: Nullable<string>;
  unit: Nullable<string>;
  author_name: Nullable<string>;
  // Only for a note with a goal: did the next result reach it?
  outcome: Nullable<GoalOutcome>;
  created_at: Date;
}

export interface PlayerProgressionDetail {
  player_id: string;
  player_name: string;
  types: Array<PlayerTypeProgression>;
  notes: Array<TestNoteItem>;
  // Every team test type, for picking a note's focus area.
  test_types: Array<TestType>;
}
