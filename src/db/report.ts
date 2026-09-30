import { and, asc, desc, eq, isNotNull, lt, lte, ne, or, inArray } from 'drizzle-orm';

import db from '@/drizzle';
import {
  InsertReportHistory,
  InsertReportSchedule,
  PlayerTable,
  ReportHistoryTable,
  ReportScheduleTable,
  UserTable,
} from '@/drizzle/schema';

import { EmailStatus, ReportStatus, UserRole } from '@/utils/enum';

/** Roles that always receive scheduled reports and are not user-selectable. */
const DEFAULT_REPORT_ROLES = [UserRole.COACH, UserRole.SUPER_ADMIN];

/**
 * @description Team members a user can pick as report recipients.
 */
export async function fetchReportRecipients(team_id: string) {
  try {
    return await db.query.UserTable.findMany({
      where: and(
        eq(UserTable.team_id, team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  } catch {
    return [];
  }
}

/**
 * @description Emails that always receive a report.
 * @default Coach, Super Admin and team captain
 */
export async function fetchDefaultRecipientEmails(
  team_id: string,
): Promise<Array<string>> {
  try {
    const rows = await db
      .selectDistinct({ email: UserTable.email })
      .from(UserTable)
      .leftJoin(PlayerTable, eq(PlayerTable.id, UserTable.id))
      .where(
        and(
          eq(UserTable.team_id, team_id),
          or(
            inArray(UserTable.role, DEFAULT_REPORT_ROLES),
            eq(PlayerTable.is_captain, true),
          ),
        ),
      );
    return rows.map((row) => row.email);
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                              Report schedules                              */
/* -------------------------------------------------------------------------- */

/**
 * @description All report schedules for a team, newest first.
 */
export async function fetchReportSchedules(team_id: string) {
  try {
    return await db.query.ReportScheduleTable.findMany({
      where: eq(ReportScheduleTable.team_id, team_id),
      orderBy: desc(ReportScheduleTable.created_at),
    });
  } catch {
    return [];
  }
}

/**
 * @description Claim schedules that are due (enabled, `next_run_at` in the
 * past), oldest first. `FOR UPDATE SKIP LOCKED` keeps overlapping cron
 * invocations from grabbing the same rows; the unique run occurrence index is
 * the second line of defense.
 */
export async function claimDueSchedules(limit: number) {
  try {
    return await db.transaction(async (tx) =>
      tx
        .select()
        .from(ReportScheduleTable)
        .where(
          and(
            eq(ReportScheduleTable.enabled, true),
            lte(ReportScheduleTable.next_run_at, new Date()),
          ),
        )
        .orderBy(asc(ReportScheduleTable.next_run_at))
        .limit(limit)
        .for('update', { skipLocked: true }),
    );
  } catch {
    return [];
  }
}

// Schedule accessors are team-scoped so tenancy is enforced once, here, and
// no caller can reach another team's schedule by guessing an id.

export async function getReportSchedule(team_id: string, schedule_id: string) {
  return await db.query.ReportScheduleTable.findFirst({
    where: and(
      eq(ReportScheduleTable.team_id, team_id),
      eq(ReportScheduleTable.schedule_id, schedule_id),
    ),
  });
}

export async function insertReportSchedule(schedule: InsertReportSchedule) {
  return await db
    .insert(ReportScheduleTable)
    .values(schedule)
    .returning({ schedule_id: ReportScheduleTable.schedule_id });
}

export async function updateReportSchedule(
  team_id: string,
  schedule_id: string,
  schedule: Partial<InsertReportSchedule>,
) {
  return await db
    .update(ReportScheduleTable)
    .set(schedule)
    .where(
      and(
        eq(ReportScheduleTable.team_id, team_id),
        eq(ReportScheduleTable.schedule_id, schedule_id),
      ),
    );
}

export async function deleteReportSchedules(
  team_id: string,
  schedule_ids: Array<string>,
) {
  return await db
    .delete(ReportScheduleTable)
    .where(
      and(
        eq(ReportScheduleTable.team_id, team_id),
        inArray(ReportScheduleTable.schedule_id, schedule_ids),
      ),
    );
}

/* -------------------------------------------------------------------------- */
/*                               Report history                               */
/* -------------------------------------------------------------------------- */

/**
 * @description Generated reports for a team, newest first.
 */
export async function fetchReportHistory(team_id: string) {
  try {
    return await db.query.ReportHistoryTable.findMany({
      where: eq(ReportHistoryTable.team_id, team_id),
      orderBy: desc(ReportHistoryTable.created_at),
    });
  } catch {
    return [];
  }
}

export async function getReportById(report_id: string) {
  return await db.query.ReportHistoryTable.findFirst({
    where: eq(ReportHistoryTable.report_id, report_id),
  });
}

export async function insertReportHistory(report: InsertReportHistory) {
  return await db
    .insert(ReportHistoryTable)
    .values(report)
    .returning({ report_id: ReportHistoryTable.report_id });
}

export async function updateReportHistory(
  report_id: string,
  report: Partial<InsertReportHistory>,
) {
  return await db
    .update(ReportHistoryTable)
    .set(report)
    .where(eq(ReportHistoryTable.report_id, report_id));
}

/**
 * @description Close a report run and advance its schedule atomically, so a
 * crash between the two writes can never leave a sent report with a stale
 * `next_run_at` (which would double-send on the next tick).
 */
export async function completeReportRun(
  report_id: string,
  report: Partial<InsertReportHistory>,
  schedule_id: string,
  schedule: Partial<InsertReportSchedule>,
) {
  return await db.transaction(async (tx) => {
    await tx
      .update(ReportHistoryTable)
      .set(report)
      .where(eq(ReportHistoryTable.report_id, report_id));
    await tx
      .update(ReportScheduleTable)
      .set(schedule)
      .where(eq(ReportScheduleTable.schedule_id, schedule_id));
  });
}

/**
 * @description Stamp the delivery status reported by the Resend webhook onto
 * the run that sent the email.
 */
export async function updateDeliveryStatus(
  resend_email_id: string,
  delivery_status: EmailStatus,
) {
  return await db
    .update(ReportHistoryTable)
    .set({ delivery_status })
    .where(eq(ReportHistoryTable.resend_email_id, resend_email_id));
}

/**
 * @description Stored reports whose blob is past its expiry and not yet
 * cleaned up — targeted by the retention job.
 */
export async function fetchExpiredReports(now: Date) {
  try {
    return await db.query.ReportHistoryTable.findMany({
      where: and(
        isNotNull(ReportHistoryTable.pathname),
        isNotNull(ReportHistoryTable.expires_at),
        lt(ReportHistoryTable.expires_at, now),
        ne(ReportHistoryTable.status, ReportStatus.EXPIRED),
      ),
    });
  } catch {
    return [];
  }
}

/**
 * @description Mark reports expired and drop their blob references.
 */
export async function markReportsExpired(report_ids: Array<string>) {
  return await db
    .update(ReportHistoryTable)
    .set({ status: ReportStatus.EXPIRED, pathname: null })
    .where(inArray(ReportHistoryTable.report_id, report_ids));
}
