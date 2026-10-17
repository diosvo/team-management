export interface DataWithStats<T, S> {
  stats: S;
  data: Array<T>;
}

/** Inclusive span of ISO days (`yyyy-MM-dd`), as carried in `?from=&to=`. */
export interface DateRange {
  from: string;
  to: string;
}

/** Inclusive ISO-day bounds a date control may offer. */
export type DateBounds = Partial<{ min: string; max: string }>;
