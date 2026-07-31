import { TestTypeUnit } from '../enum';
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
