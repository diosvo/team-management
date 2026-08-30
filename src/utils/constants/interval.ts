import type { Selection } from '../type';
import { Interval } from '../enum';
import { ESTABLISHED_DATE } from './app';

const START_YEAR = new Date(ESTABLISHED_DATE).getFullYear();

export const YEARS_SELECTION: Selection<number> = Array.from(
  { length: new Date().getFullYear() - START_YEAR + 1 },
  (_, i) => ({
    label: (START_YEAR + i).toString(),
    value: START_YEAR + i,
  }),
);

/** Display names for a report window: report history and the range presets. */
export const INTERVAL_LABEL: Record<Interval, string> = {
  [Interval.THIS_MONTH]: 'This month',
  [Interval.LAST_MONTH]: 'Last month',
  [Interval.THIS_YEAR]: 'This year',
  [Interval.LAST_YEAR]: 'Last year',
};
