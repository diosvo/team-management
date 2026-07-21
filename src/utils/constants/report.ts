import { ReportFrequency } from '../enum';
import type { Selection } from '../type';

/**
 * Timezone every schedule is anchored to. Cadence math runs in this zone so a
 * "Monday 8:00" report stays at 8:00 local regardless of the server's clock.
 */
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Highest selectable day of month, so the chosen day exists in every month. */
export const MAX_DAY_OF_MONTH = 28;

export const FREQUENCY_SELECTION: Selection<ReportFrequency> = [
  {
    label: 'Weekly',
    value: ReportFrequency.WEEKLY,
  },
  {
    label: 'Monthly',
    value: ReportFrequency.MONTHLY,
  },
  {
    label: 'Quarterly',
    value: ReportFrequency.QUARTERLY,
  },
];

/** Values match `Date.getDay()`, where Sunday is 0. */
export const WEEKDAY_SELECTION: Selection<number> = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

export const WEEKDAY_LABEL = new Map(
  WEEKDAY_SELECTION.map(({ label, value }) => [value, label]),
);

/** Auth-gated endpoint that streams a stored report PDF from private Blob. */
export const reportDownloadUrl = (report_id: string) =>
  `/api/reports/download?id=${report_id}`;
