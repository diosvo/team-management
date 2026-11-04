import { ActivityKind } from '../enum';
import type { Selection } from '../type';

/** Tabs on the My Performance page; the value doubles as the `tab` URL param. */
export const PERFORMANCE_TABS = [
  'attendance',
  'testing',
  'activity',
  'matches',
] as const;
export type PerformanceTab = (typeof PERFORMANCE_TABS)[number];

/** Labels are English fallbacks; the UI reads `performance.tabs.<value>`. */
export const PERFORMANCE_TAB_SELECTION: Selection<PerformanceTab> = [
  { label: 'Attendance', value: 'attendance' },
  { label: 'Testing', value: 'testing' },
  { label: 'Activity', value: 'activity' },
  { label: 'Matches', value: 'matches' },
];

/** Labels are English fallbacks; the UI reads `performance.activity.filters.<value>`. */
export const ACTIVITY_KIND_SELECTION: Selection<ActivityKind> = [
  { label: 'Training', value: ActivityKind.TRAINING },
  { label: 'Fitness tests', value: ActivityKind.TEST },
  { label: 'Matches', value: ActivityKind.MATCH },
];

/** Team attendance target, drawn on the dashboard and performance trend charts. */
export const ATTENDANCE_TARGET_RATE = 80 as const;

/** Rolling window (in days) for the "recent trend" comparison. */
export const TREND_WINDOW_DAYS = 28 as const;
