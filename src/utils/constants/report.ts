import { Interval } from '../enum';
import type { Selection } from '../type';

/**
 * Timezone every schedule is anchored to. Cadence math runs in this zone so
 * "the 1st at 8:00" stays at 8:00 local regardless of the server's clock.
 */
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Data windows that can be scheduled. The cadence is implied by the window:
 * a "last month" report goes out on the 1st of every month and a "last year"
 * report on 1 January, both once the window has closed.
 */
export const SCHEDULED_INTERVAL_SELECTION: Selection<
  typeof Interval.LAST_MONTH | typeof Interval.LAST_YEAR
> = [
  { label: 'Monthly · last month, on the 1st', value: Interval.LAST_MONTH },
  { label: 'Yearly · last year, on 1 January', value: Interval.LAST_YEAR },
];

export const SCHEDULED_INTERVALS = SCHEDULED_INTERVAL_SELECTION.map(
  ({ value }) => value,
);
export type ScheduledInterval = (typeof SCHEDULED_INTERVALS)[number];

export const SCHEDULED_INTERVAL_LABEL = new Map<string, string>(
  SCHEDULED_INTERVAL_SELECTION.map(({ label, value }) => [value, label]),
);

/** Auth-gated endpoint that streams a stored report PDF from private Blob. */
export const reportDownloadUrl = (report_id: string) =>
  `/api/reports/download?id=${report_id}`;
