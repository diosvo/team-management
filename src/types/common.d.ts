import { Interval } from '@/utils/enum';

export interface DataWithStats<T, S> {
  stats: S;
  data: Array<T>;
}

export type IntervalValues = `${Interval}`;
