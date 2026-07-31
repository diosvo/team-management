import type { IntervalValues } from '@/types/common';
import { Interval } from '../enum';
import type { Selection } from '../type';
import { ESTABLISHED_DATE } from './app';

const START_YEAR = new Date(ESTABLISHED_DATE).getFullYear();

export const MONTHS_SELECTION: Selection<number> = Array.from(
  { length: 12 },
  (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }),
);

export const YEARS_SELECTION: Selection<number> = Array.from(
  { length: new Date().getFullYear() - START_YEAR + 1 },
  (_, i) => ({
    label: (START_YEAR + i).toString(),
    value: START_YEAR + i,
  }),
);

export const INTERVAL_SELECTION: Selection<IntervalValues> = [
  {
    label: 'This month',
    value: Interval.THIS_MONTH,
  },
  {
    label: 'Last month',
    value: Interval.LAST_MONTH,
  },
  {
    label: 'This year',
    value: Interval.THIS_YEAR,
  },
  {
    label: 'Last year',
    value: Interval.LAST_YEAR,
  },
];
export const INTERVAL_VALUES = INTERVAL_SELECTION.map(({ value }) => value);
