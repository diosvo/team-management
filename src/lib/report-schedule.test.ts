import { Interval } from '@/utils/enum';

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
describe('computeNextRun', () => {
  describe('last month → the 1st of every month', () => {
    test('rolls to the 1st of next month mid-month', () => {
      const next = computeNextRun(
        Interval.LAST_MONTH,
        new Date('2026-08-26T00:00:00Z'),
      );

      expect(next.toISOString()).toBe('2026-09-01T01:00:00.000Z');
    });

    test('keeps today when it is the 1st and the send hour is still ahead', () => {
      // 1 Sep at 06:00 local.
      const next = computeNextRun(
        Interval.LAST_MONTH,
        new Date('2026-08-31T23:00:00Z'),
      );

      expect(next.toISOString()).toBe('2026-09-01T01:00:00.000Z');
    });

    test('skips a month when the send hour on the 1st has passed', () => {
      // 1 Sep at 08:00 local exactly — the occurrence itself is not "after".
      const next = computeNextRun(
        Interval.LAST_MONTH,
        new Date('2026-09-01T01:00:00Z'),
      );

      expect(next.toISOString()).toBe('2026-10-01T01:00:00.000Z');
    });

    test('crosses the year boundary from December', () => {
      const next = computeNextRun(
        Interval.LAST_MONTH,
        new Date('2026-12-15T00:00:00Z'),
      );

      expect(next.toISOString()).toBe('2027-01-01T01:00:00.000Z');
    });
  });

  describe('last year → 1 January', () => {
    test('rolls to next 1 January mid-year', () => {
      const next = computeNextRun(
        Interval.LAST_YEAR,
        new Date('2026-08-26T00:00:00Z'),
      );

      expect(next.toISOString()).toBe('2027-01-01T01:00:00.000Z');
    });

    test('skips a year once 1 January 08:00 has passed', () => {
      const next = computeNextRun(
        Interval.LAST_YEAR,
        new Date('2027-01-01T02:00:00Z'),
      );

      expect(next.toISOString()).toBe('2028-01-01T01:00:00.000Z');
    });
  });
});
