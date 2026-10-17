import { isUniqueViolation } from '@/db/pg-error';
import {
  completeReportRun,
  fetchDefaultRecipientEmails,
  insertReportHistory,
  reclaimStaleReportRun,
  updateReportHistory,
} from '@/db/report';
import { ReportSchedule } from '@/drizzle/schema';
import { Interval, ReportStatus, ReportTrigger } from '@/utils/enum';

import {
  renderReportPdf,
  reportExpiresAt,
  reportFilename,
  storeReportPdf,
} from './report';
import {
  computeNextRun,
  executeSchedule,
  ExecuteScheduleOptions,
} from './report-schedule';
import { sendEmail } from './resend';

vi.mock('@/db/report', () => ({
  completeReportRun: vi.fn(),
  fetchDefaultRecipientEmails: vi.fn(),
  insertReportHistory: vi.fn(),
  reclaimStaleReportRun: vi.fn(),
  updateReportHistory: vi.fn(),
}));

// Skip the in-process retry backoff.
vi.mock('es-toolkit/promise', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/db/pg-error', () => ({
  isUniqueViolation: vi.fn(),
}));

vi.mock('./report', () => ({
  dashboardPath: vi.fn(),
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

describe('executeSchedule', () => {
  const TEAM_ID = 'team-1';
  const SCHEDULED_FOR = new Date('2026-09-01T01:00:00Z');
  const NEXT_RUN = new Date('2026-10-01T01:00:00Z');
  const EXPIRES_AT = new Date('2026-11-30T01:00:00Z');

  const schedule = {
    schedule_id: 'schedule-1',
    team_id: TEAM_ID,
    interval: Interval.LAST_MONTH,
    recipients: ['coach@example.com'],
    next_run_at: SCHEDULED_FOR,
  } as ReportSchedule;

  const options: ExecuteScheduleOptions = {
    schedule,
    scheduled_for: SCHEDULED_FOR,
    trigger: ReportTrigger.SCHEDULED,
    origin: 'https://portal.app',
    host: 'portal.app',
    cookies: [{ name: 'session', value: 'token' }],
    session_team_id: TEAM_ID,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(insertReportHistory).mockResolvedValue([
      { report_id: 'report-1' },
    ] as never);
    vi.mocked(renderReportPdf).mockResolvedValue(Buffer.from('pdf'));
    vi.mocked(reportFilename).mockReturnValue('analytics.pdf');
    vi.mocked(reportExpiresAt).mockReturnValue(EXPIRES_AT);
    vi.mocked(storeReportPdf).mockResolvedValue({
      pathname: 'reports/report.pdf',
    } as never);
    vi.mocked(sendEmail).mockResolvedValue({
      data: { id: 'email-1' },
    } as never);
    vi.mocked(fetchDefaultRecipientEmails).mockResolvedValue([
      'admin@example.com',
    ]);
  });

  test('renders, sends and advances the schedule', async () => {
    const result = await executeSchedule(options);

    expect(result).toEqual({
      schedule_id: 'schedule-1',
      outcome: 'sent',
      report_id: 'report-1',
    });
    expect(updateReportHistory).toHaveBeenCalledWith('report-1', {
      pathname: 'reports/report.pdf',
      filename: 'analytics.pdf',
    });
    expect(completeReportRun).toHaveBeenCalledWith(
      'report-1',
      expect.objectContaining({
        status: ReportStatus.SUCCESS,
        resend_email_id: 'email-1',
        expires_at: EXPIRES_AT,
      }),
      'schedule-1',
      expect.objectContaining({ next_run_at: NEXT_RUN }),
    );
  });

  test('skips an occurrence that is already running', async () => {
    vi.mocked(insertReportHistory).mockRejectedValue(new Error('duplicate'));
    vi.mocked(isUniqueViolation).mockReturnValue(true);
    vi.mocked(reclaimStaleReportRun).mockResolvedValue(undefined);

    const result = await executeSchedule(options);

    expect(result).toEqual({
      schedule_id: 'schedule-1',
      outcome: 'skipped_duplicate',
    });
    expect(renderReportPdf).not.toHaveBeenCalled();
    expect(completeReportRun).not.toHaveBeenCalled();
  });

  test('takes over a stale pending run and reuses its stored PDF', async () => {
    vi.mocked(insertReportHistory).mockRejectedValue(new Error('duplicate'));
    vi.mocked(isUniqueViolation).mockReturnValue(true);
    vi.mocked(reclaimStaleReportRun).mockResolvedValue({
      report_id: 'report-stale',
      pathname: 'reports/stale.pdf',
    });

    const result = await executeSchedule(options);

    expect(result).toEqual({
      schedule_id: 'schedule-1',
      outcome: 'sent',
      report_id: 'report-stale',
    });
    expect(renderReportPdf).not.toHaveBeenCalled();
    expect(completeReportRun).toHaveBeenCalledWith(
      'report-stale',
      expect.objectContaining({ status: ReportStatus.SUCCESS }),
      'schedule-1',
      expect.objectContaining({ next_run_at: NEXT_RUN }),
    );
  });

  test('fails without retrying on a non-duplicate insert error', async () => {
    vi.mocked(insertReportHistory).mockRejectedValue(new Error('db down'));
    vi.mocked(isUniqueViolation).mockReturnValue(false);

    const result = await executeSchedule(options);

    expect(result).toEqual({
      schedule_id: 'schedule-1',
      outcome: 'failed',
      error: 'db down',
    });
    expect(reclaimStaleReportRun).not.toHaveBeenCalled();
  });

  test('retries a failed send without re-rendering the PDF', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('resend down'));

    const result = await executeSchedule(options);

    expect(result.outcome).toBe('sent');
    expect(renderReportPdf).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(updateReportHistory).toHaveBeenCalledWith('report-1', {
      attempts: 2,
    });
  });

  test('records the final failure, expires the stored PDF and notifies', async () => {
    vi.mocked(sendEmail).mockImplementation(async ({ subject }) => {
      if (subject === 'Analytics Overview Report') {
        throw new Error('resend down');
      }
      return { data: { id: 'email-2' } } as never;
    });

    const result = await executeSchedule(options);

    expect(result).toEqual({
      schedule_id: 'schedule-1',
      outcome: 'failed',
      report_id: 'report-1',
      error: 'resend down',
    });
    expect(renderReportPdf).toHaveBeenCalledTimes(1);
    expect(completeReportRun).toHaveBeenCalledWith(
      'report-1',
      expect.objectContaining({
        status: ReportStatus.FAILED,
        error: 'resend down',
        expires_at: EXPIRES_AT,
      }),
      'schedule-1',
      { next_run_at: NEXT_RUN },
    );
    expect(sendEmail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: ['admin@example.com'],
        subject: 'Scheduled Report Failed',
      }),
    );
  });

  test('leaves expires_at empty when no PDF was stored', async () => {
    vi.mocked(renderReportPdf).mockRejectedValue(new Error('timeout'));

    const result = await executeSchedule({
      ...options,
      trigger: ReportTrigger.MANUAL,
    });

    expect(result.outcome).toBe('failed');
    expect(renderReportPdf).toHaveBeenCalledTimes(3);
    expect(completeReportRun).toHaveBeenCalledWith(
      'report-1',
      expect.objectContaining({
        status: ReportStatus.FAILED,
        expires_at: null,
      }),
      'schedule-1',
      { next_run_at: NEXT_RUN },
    );
    // Manual runs report the failure to the caller instead of by email.
    expect(fetchDefaultRecipientEmails).not.toHaveBeenCalled();
  });

  test('refuses to render under another team’s session', async () => {
    const result = await executeSchedule({
      ...options,
      session_team_id: 'team-2',
    });

    expect(result).toEqual({
      schedule_id: 'schedule-1',
      outcome: 'failed',
      report_id: 'report-1',
      error: 'Report session does not belong to the schedule team',
    });
    expect(renderReportPdf).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Analytics Overview Report' }),
    );
  });
});
