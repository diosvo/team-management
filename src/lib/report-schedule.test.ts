import { DEFAULT_TIMEZONE } from '@/utils/constants';
import { ReportFrequency } from '@/utils/enum';

import { computeNextRun } from './report-schedule';

// The module pulls in the renderer, the mailer and the db on import; the
// cadence math under test touches none of them.
vi.mock('@/db/report', () => ({
  completeReportRun: vi.fn(),
  fetchDefaultRecipientEmails: vi.fn(),
  insertReportHistory: vi.fn(),
  updateReportHistory: vi.fn(),
}));

vi.mock('@/db/pg-error', () => ({
  isUniqueViolation: vi.fn(),
}));

vi.mock('./report', () => ({
  renderReportPdf: vi.fn(),
  reportExpiresAt: vi.fn(),
  reportFilename: vi.fn(),
  storeReportPdf: vi.fn(),
}));

vi.mock('./resend', () => ({
  sendEmail: vi.fn(),
}));

// Asia/Ho_Chi_Minh is UTC+7 year-round, so 08:00 local is always 01:00Z.
const cadence = (overrides: Partial<Parameters<typeof computeNextRun>[0]>) => ({
  frequency: ReportFrequency.MONTHLY,
  day_of_week: null,
  day_of_month: 1,
  timezone: DEFAULT_TIMEZONE,
  ...overrides,
});

describe('computeNextRun', () => {
  describe('weekly', () => {
    const weekly = cadence({
      frequency: ReportFrequency.WEEKLY,
      day_of_week: 1, // Monday
    });

    test('lands on the next matching weekday', () => {
      // Wednesday 2026-08-26 → Monday 2026-08-31.
      const next = computeNextRun(weekly, new Date('2026-08-26T00:00:00Z'));

      expect(next.toISOString()).toBe('2026-08-31T01:00:00.000Z');
    });

    test('skips a full week when today is the weekday but the hour passed', () => {
      // Monday 2026-08-31 at 09:00 local → the following Monday.
      const next = computeNextRun(weekly, new Date('2026-08-31T02:00:00Z'));

      expect(next.toISOString()).toBe('2026-09-07T01:00:00.000Z');
    });
  });

  describe('monthly', () => {
    const monthly = cadence({
      frequency: ReportFrequency.MONTHLY,
      day_of_month: 5,
    });

    test('lands on the chosen day of the current month when still ahead', () => {
      const next = computeNextRun(monthly, new Date('2026-08-01T00:00:00Z'));

      expect(next.toISOString()).toBe('2026-08-05T01:00:00.000Z');
    });

    test('rolls into the next month once the day has passed', () => {
      const next = computeNextRun(monthly, new Date('2026-08-30T00:00:00Z'));

      expect(next.toISOString()).toBe('2026-09-05T01:00:00.000Z');
    });
  });

  describe('quarterly', () => {
    const quarterly = cadence({
      frequency: ReportFrequency.QUARTERLY,
      day_of_month: 5,
    });

    test('sends on the chosen day of the current quarter month', () => {
      // 1 July is inside Q3, whose anchor month is July.
      const next = computeNextRun(quarterly, new Date('2026-07-01T00:00:00Z'));

      expect(next.toISOString()).toBe('2026-07-05T01:00:00.000Z');
    });

    test('skips to the next quarter when the anchor month has passed', () => {
      // Still Q3 in August, but 5 July is behind us — next is 5 October.
      const next = computeNextRun(quarterly, new Date('2026-08-30T00:00:00Z'));

      expect(next.toISOString()).toBe('2026-10-05T01:00:00.000Z');
    });

    test('crosses the year boundary from the last quarter', () => {
      const next = computeNextRun(quarterly, new Date('2026-11-20T00:00:00Z'));

      expect(next.toISOString()).toBe('2027-01-05T01:00:00.000Z');
    });
  });
});
