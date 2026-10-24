import { PerformanceBand, ProgressStatus, TestTypeUnit } from '../enum';
import type { Selection } from '../type';

export const SELECTABLE_TEST_TYPES = [
  TestTypeUnit.METERS,
  TestTypeUnit.PERCENT,
  TestTypeUnit.POINTS,
  TestTypeUnit.REPS,
  TestTypeUnit.SECONDS,
  TestTypeUnit.TIMES,
] as const;
export const TEST_TYPE_UNIT_SELECTION: Selection<string> = [
  {
    label: 'Meters',
    value: TestTypeUnit.METERS,
  },
  {
    label: 'Percent',
    value: TestTypeUnit.PERCENT,
  },
  {
    label: 'Points',
    value: TestTypeUnit.POINTS,
  },
  {
    label: 'Reps',
    value: TestTypeUnit.REPS,
  },
  {
    label: 'Seconds',
    value: TestTypeUnit.SECONDS,
  },
  {
    label: 'Times',
    value: TestTypeUnit.TIMES,
  },
];

export const TEST_DIRECTION_SELECTION: Selection<string> = [
  { label: 'Higher is better', value: 'higher' },
  { label: 'Lower is better', value: 'lower' },
];

export const SELECTABLE_PROGRESS_STATUS = [
  ProgressStatus.IMPROVING,
  ProgressStatus.STABLE,
  ProgressStatus.PLATEAUING,
  ProgressStatus.REGRESSING,
  ProgressStatus.INSUFFICIENT,
] as const;
export const PROGRESS_STATUS_SELECTION: Selection<string> = [
  { label: 'Improving', value: ProgressStatus.IMPROVING },
  { label: 'Stable', value: ProgressStatus.STABLE },
  { label: 'Plateauing', value: ProgressStatus.PLATEAUING },
  { label: 'Regressing', value: ProgressStatus.REGRESSING },
  { label: 'Not enough data', value: ProgressStatus.INSUFFICIENT },
];
export const PROGRESS_STATUS_COLOR: Record<ProgressStatus, string> = {
  [ProgressStatus.IMPROVING]: 'green',
  [ProgressStatus.STABLE]: 'blue',
  [ProgressStatus.PLATEAUING]: 'orange',
  [ProgressStatus.REGRESSING]: 'red',
  [ProgressStatus.INSUFFICIENT]: 'gray',
};

export const SELECTABLE_PERFORMANCE_BANDS = [
  PerformanceBand.ELITE,
  PerformanceBand.ON_TARGET,
  PerformanceBand.BELOW_TARGET,
  PerformanceBand.NEEDS_WORK,
] as const;
export const PERFORMANCE_BAND_SELECTION: Selection<string> = [
  { label: 'Elite', value: PerformanceBand.ELITE },
  { label: 'On target', value: PerformanceBand.ON_TARGET },
  { label: 'Below target', value: PerformanceBand.BELOW_TARGET },
  { label: 'Needs work', value: PerformanceBand.NEEDS_WORK },
];
export const PERFORMANCE_BAND_COLOR: Record<PerformanceBand, string> = {
  [PerformanceBand.ELITE]: 'purple',
  [PerformanceBand.ON_TARGET]: 'green',
  [PerformanceBand.BELOW_TARGET]: 'orange',
  [PerformanceBand.NEEDS_WORK]: 'red',
};
