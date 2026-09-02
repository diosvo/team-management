import { TZDate } from '@date-fns/tz';
import { addDays, addMonths, setDate, setMonth } from 'date-fns';
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

import { reportDownloadUrl } from '@/utils/constants';
import { ReportFrequency, ReportStatus, ReportTrigger } from '@/utils/enum';
import { formatDuration } from '@/utils/formatter';

import {
  renderReportPdf,
  reportExpiresAt,
  reportFilename,
  storeReportPdf,
} from './report';
import { sendEmail } from './resend';

/**
 * Every report sends at a fixed hour in the schedule's timezone (08:00 ICT by
 * default). A daily cron tick cannot honor arbitrary times, so there is no
 * per-schedule time picker.
 */
export const SEND_HOUR_LOCAL = 8;

const MAX_ATTEMPTS = 3;
/** In-process backoff between attempts — with a daily tick, a "retry on the
 * next tick" would mean tomorrow, so transient failures are absorbed here. */
const RETRY_DELAYS_MS = [5_000, 20_000];

type NextRunInput = Pick<
  ReportSchedule,
  'frequency' | 'day_of_week' | 'day_of_month' | 'timezone'
>;

/**
 * Next occurrence of a schedule strictly after `after`, computed in the
 * schedule's timezone and returned as a UTC instant. Calendar math never
 * happens in UTC, so DST timezones stay correct.
 */
export function computeNextRun(schedule: NextRunInput, after: Date): Date {
  const local = new TZDate(after, schedule.timezone);
  let next = new TZDate(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    SEND_HOUR_LOCAL,
    0,
    0,
    schedule.timezone,
  );

  if (schedule.frequency === ReportFrequency.WEEKLY) {
    const day = schedule.day_of_week ?? 1;
    const delta = (day - next.getDay() + 7) % 7;
    next = addDays(next, delta);
    if (next <= local) next = addDays(next, 7);
  } else {
    const day = schedule.day_of_month ?? 1;
    // The day is capped at 28, so setting it before the month can never
    // overflow into the following one.
    next = setDate(next, day);

    if (schedule.frequency === ReportFrequency.QUARTERLY) {
      // Anchored to calendar quarters — January, April, July, October — so the
      // send months do not depend on when the schedule happened to be created.
      next = setMonth(next, Math.floor(local.getMonth() / 3) * 3);
      if (next <= local) next = addMonths(next, 3);
    } else if (next <= local) {
      next = addMonths(next, 1);
    }
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
 * Execute one occurrence of a schedule: record the run (idempotency gate),
 * render + store the PDF, email the recipients a download link, then close the
 * run and advance `next_run_at`. Failures retry in-process; the PDF is not
 * re-rendered when only the email failed. Never throws — the outcome is
 * returned so callers (cron loop or server action) can report per-schedule
 * results.
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
          next_run_at: computeNextRun(schedule, scheduled_for),
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
      { next_run_at: computeNextRun(schedule, scheduled_for) },
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
