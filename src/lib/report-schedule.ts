import { TZDate } from '@date-fns/tz';
import { delay } from 'es-toolkit/promise';

import AnalyticsReport from '@/app/(protected)/(overview)/reports/_components/AnalyticsReport';
import EmailLayout from '@/components/common/EmailLayout';

import { isUniqueViolation } from '@/db/pg-error';
import {
  completeReportRun,
  fetchDefaultRecipientEmails,
  insertReportHistory,
  updateReportHistory,
} from '@/db/report';
import { ReportSchedule } from '@/drizzle/schema';

import { DEFAULT_TIMEZONE, reportDownloadUrl } from '@/utils/constants';
import { Interval, ReportStatus, ReportTrigger } from '@/utils/enum';
import { formatDuration } from '@/utils/formatter';

import {
  renderReportPdf,
  reportExpiresAt,
  reportFilename,
  storeReportPdf,
} from './report';
import { sendEmail } from './resend';

/**
 * Every report sends at a fixed hour in `DEFAULT_TIMEZONE` (08:00 ICT). A
 * daily cron tick cannot honor arbitrary times, so there is no time picker.
 */
export const SEND_HOUR_LOCAL = 8;

const MAX_ATTEMPTS = 3;
/** In-process backoff between attempts — with a daily tick, a "retry on the
 * next tick" would mean tomorrow, so transient failures are absorbed here. */
const RETRY_DELAYS_MS = [5_000, 20_000];

/**
 * Next send time after `after`, based on the reporting window. Monthly reports
 * run on the 1st; yearly reports run on 1 Jan, in the local timezone.
 */
export function computeNextRun(interval: Interval, after: Date): Date {
  const local = new TZDate(after, DEFAULT_TIMEZONE);
  const yearly = interval === Interval.LAST_YEAR;

  const at = (year: number, month: number) =>
    new TZDate(year, month, 1, SEND_HOUR_LOCAL, 0, 0, DEFAULT_TIMEZONE);

  // Start from the current period's send day; roll forward once it has passed.
  let next = at(local.getFullYear(), yearly ? 0 : local.getMonth());
  if (next <= local) {
    next = yearly
      ? at(local.getFullYear() + 1, 0)
      : at(local.getFullYear(), local.getMonth() + 1);
  }

  return new Date(next.getTime());
}

export interface ExecuteScheduleOptions {
  schedule: ReportSchedule;
  /**
   * The planned occurrence being executed — the schedule's `next_run_at` for
   * cron runs, `now()` for "Run now". Also the idempotency key: the same
   * occurrence can never run twice.
   */
  scheduled_for: Date;
  trigger: ReportTrigger;
  /** Origin used both to render the dashboard and to build the download link. */
  origin: string;
  /** Cookie domain (request host). */
  host: string;
  /** Session cookies forwarded to the headless browser. */
  cookies: Array<{ name: string; value: string }>;
}

export interface ExecuteScheduleResult {
  schedule_id: string;
  outcome: 'sent' | 'failed' | 'skipped_duplicate';
  report_id?: string;
  error?: string;
}

/**
 * Execute one schedule occurrence: record the run, render/store the PDF,
 * email recipients, then advance `next_run_at`. Retries happen in-process;
 * failures never throw and return an outcome for the caller.
 */
export async function executeSchedule({
  schedule,
  scheduled_for,
  trigger,
  origin,
  host,
  cookies,
}: ExecuteScheduleOptions): Promise<ExecuteScheduleResult> {
  const { schedule_id, team_id, interval, recipients } = schedule;
  const period = formatDuration(interval);

  // 1. Idempotency gate — insert the run row FIRST. A unique violation means
  //    this occurrence was already executed (overlapping tick, manual re-fire,
  //    or a hostile hit on the cron URL): skip silently.
  let report_id: string;
  try {
    [{ report_id }] = await insertReportHistory({
      team_id,
      schedule_id,
      scheduled_for,
      interval,
      period,
      trigger,
      status: ReportStatus.PENDING,
      attempts: 1,
      started_at: new Date(),
    });
  } catch (error) {
    if (isUniqueViolation(error, 'unique_report_run_occurrence')) {
      return { schedule_id, outcome: 'skipped_duplicate' };
    }
    return { schedule_id, outcome: 'failed', error: (error as Error).message };
  }

  // Step memoization across retries: a Resend failure must not re-render.
  let pathname: string | null = null;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) {
        await updateReportHistory(report_id, { attempts: attempt });
      }

      // 2. Generate + archive — skipped on retry if the PDF already exists.
      if (!pathname) {
        const buffer = await renderReportPdf({
          origin,
          path: `/dashboard?interval=${interval}`,
          host,
          cookies,
          period,
        });
        const filename = reportFilename(interval, period);
        ({ pathname } = await storeReportPdf(filename, buffer));
        // Persist immediately so even a failed run records its blob.
        await updateReportHistory(report_id, { pathname, filename });
      }

      // 3. Send
      let resend_email_id: string | null = null;
      if (recipients.length > 0) {
        const response = await sendEmail({
          to: recipients,
          subject: 'Analytics Overview Report',
          html: AnalyticsReport({
            period,
            downloadUrl: `${origin}${reportDownloadUrl(report_id)}`,
          }),
        });
        resend_email_id = response.data?.id ?? null;
      }

      // 4. Success: close the run and advance the schedule atomically.
      await completeReportRun(
        report_id,
        {
          status: ReportStatus.SUCCESS,
          resend_email_id,
          completed_at: new Date(),
          expires_at: reportExpiresAt(),
        },
        schedule_id,
        {
          last_run_at: new Date(),
          next_run_at: computeNextRun(interval, scheduled_for),
        },
      );
      return { schedule_id, outcome: 'sent', report_id };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await delay(RETRY_DELAYS_MS[attempt - 1]);
    }
  }

  // 5. Final failure: record it but STILL advance the schedule — with a daily
  //    tick there is no "retry tomorrow"; a human recovers via "Run now".
  const message = (lastError as Error)?.message ?? String(lastError);
  try {
    await completeReportRun(
      report_id,
      {
        status: ReportStatus.FAILED,
        error: message,
        completed_at: new Date(),
      },
      schedule_id,
      { next_run_at: computeNextRun(interval, scheduled_for) },
    );
  } catch {
    // The failed status is best-effort; the run row already exists.
  }

  if (trigger === ReportTrigger.SCHEDULED) {
    await notifyFailure(schedule, period, message, origin);
  }

  return { schedule_id, outcome: 'failed', report_id, error: message };
}

/**
 * Tell the coaches/admins a scheduled report did not go out, with a link to
 * the history list where the failed run (and "Run now" recovery) lives.
 */
async function notifyFailure(
  schedule: ReportSchedule,
  period: string,
  error: string,
  origin: string,
) {
  try {
    const emails = await fetchDefaultRecipientEmails(schedule.team_id);
    if (emails.length === 0) return;

    await sendEmail({
      to: emails,
      subject: 'Scheduled Report Failed',
      html: EmailLayout(`
        <p style="font-size: 14px; margin-bottom: 8px;">
          The scheduled analytics report for <strong>${period}</strong> could
          not be generated after ${MAX_ATTEMPTS} attempts.
        </p>
        <p style="font-size: 14px; margin-bottom: 8px; color: #666;">
          ${error}
        </p>
        <p style="font-size: 14px;">
          <a href="${origin}/reports">Review it on the Reports page</a> and use
          "Run now" to send it manually.
        </p>
      `),
    });
  } catch {
    // Never let the notification mask the run outcome.
  }
}
