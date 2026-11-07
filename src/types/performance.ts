import type { MatchAverageField } from '@/utils/constants';
import type { ActivityKind, AttendanceStatus, MatchResult } from '@/utils/enum';

import type { Achievement } from '@/drizzle/schema/achievement';

/** Rolling comparison of the last N days against the N days before them. */
export interface AttendanceTrend {
  recent: number;
  previous: number;
  delta: number;
}

export interface MonthlyAttendance {
  /** `YYYY-MM`: the sort key, formatted per locale for the axis label. */
  month: string;
  player: Nullable<number>;
  team: Nullable<number>;
}

export interface AttendanceOverview {
  total: number;
  on_time: number;
  late: number;
  absent: number;
  /** Attended (on time + late) over total, 0–100 with one decimal. */
  rate: number;
  team_rate: number;
  current_streak: number;
  best_streak: number;
  trend: Nullable<AttendanceTrend>;
  monthly: Array<MonthlyAttendance>;
  /** `name` is null when no reason was given. */
  reasons: Array<{ name: Nullable<string>; count: number }>;
}

export interface TestPoint {
  date: string;
  result: number;
  team_avg: Nullable<number>;
}

export interface TestTypeProgress {
  type_id: string;
  name: string;
  unit: string;
  lower_is_better: boolean;
  latest: {
    date: string;
    result: number;
    /** Signed so that positive always means "better", whatever the unit. */
    improvement_pct: Nullable<number>;
    team_avg: Nullable<number>;
    /** Share of teammates tested the same day that this result beats. */
    percentile: Nullable<number>;
  };
  series: Array<TestPoint>;
}

export interface TestingOverview {
  types: Array<TestTypeProgress>;
  /** Distinct testing dates the player took part in. */
  tests_taken: number;
  last_tested: Nullable<string>;
}

interface ActivityBase<K extends ActivityKind> {
  id: string;
  date: string;
  kind: K;
}

/** A team training session in the period, with the player's attendance. */
export interface TrainingActivity extends ActivityBase<
  typeof ActivityKind.TRAINING
> {
  location: Nullable<string>;
  /** Session length in hours, `null` when the times are missing or invalid. */
  duration_hours: Nullable<number>;
  status: Nullable<AttendanceStatus>;
  reason: Nullable<string>;
}

/** Every periodic test result the player recorded on one day. */
export interface TestActivity extends ActivityBase<typeof ActivityKind.TEST> {
  results: Array<{ name: string; result: number; unit: string }>;
}

/** A completed match with the player's box score. */
export interface MatchActivity extends ActivityBase<typeof ActivityKind.MATCH> {
  opponent: string;
  result: MatchResult;
  score: string;
  points_scored: number;
  rebounds: number;
  assists: number;
}

/** One row of the activity log; the words are rendered by the component. */
export type ActivityRecord = TrainingActivity | TestActivity | MatchActivity;

export interface MatchPerformanceRecord {
  match_id: string;
  date: string;
  opponent: string;
  result: MatchResult;
  score: string;
  points_scored: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

export interface MatchesOverview {
  records: Array<MatchPerformanceRecord>;
  averages: Record<MatchAverageField, number>;
}

export interface PerformanceSummary {
  attendance: Pick<
    AttendanceOverview,
    'rate' | 'total' | 'on_time' | 'late' | 'current_streak' | 'best_streak'
  >;
  tests_taken: number;
  last_tested: Nullable<string>;
  honors: {
    count: number;
    /** Newest first by year; `null` without any honor. */
    latest: Nullable<Pick<Achievement, 'type' | 'year'>>;
  };
}

export interface PerformanceIdentity {
  id: string;
  name: string;
  /** Whether the signed-in user is looking at their own page. */
  is_own: boolean;
  is_player: boolean;
  is_captain: boolean;
  jersey_number: Nullable<number>;
  position: Nullable<string>;
}
