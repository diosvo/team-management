import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { DEFAULT_TIMEZONE } from '@/utils/constants';
import {
  EmailStatus,
  Interval,
  ReportFrequency,
  ReportStatus,
  ReportTrigger,
} from '@/utils/enum';

import { created_at, updated_at } from '../helpers';
import { TeamTable } from './team';

export const reportIntervalEnum = pgEnum('report_interval', Interval);
export const reportFrequencyEnum = pgEnum('report_frequency', ReportFrequency);
export const reportStatusEnum = pgEnum('report_status', ReportStatus);
export const reportTriggerEnum = pgEnum('report_trigger', ReportTrigger);

/**
 * A recurring report configuration for a team. `interval` picks the data
 * window rendered into the PDF; `frequency` + `day_of_week`/`day_of_month`
 * pick the cadence. Every report sends at a fixed morning hour in the
 * schedule's `timezone`, so `next_run_at` (UTC) is precomputed on every
 * create/edit/run and the daily cron simply polls for overdue rows.
 */
export const ReportScheduleTable = pgTable(
  'report_schedule',
  {
    schedule_id: uuid().primaryKey().defaultRandom(),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    interval: reportIntervalEnum().notNull(),
    frequency: reportFrequencyEnum().notNull(),
    /** 0-6 (Sun-Sat) — required when `frequency` is weekly. */
    day_of_week: integer(),
    /** 1-28 — required when `frequency` is monthly. */
    day_of_month: integer(),
    timezone: text().notNull().default(DEFAULT_TIMEZONE),
    recipients: text().array().notNull().default([]),
    /** UTC instant of the next occurrence, precomputed by `computeNextRun`. */
    next_run_at: timestamp({ withTimezone: true }).notNull(),
    last_run_at: timestamp({ withTimezone: true }),
    enabled: boolean().notNull().default(true),
    created_at,
    updated_at,
  },
  (table) => [
    unique().on(table.team_id, table.interval),
    // Tick query: only enabled rows are ever polled (partial index).
    index('idx_report_schedule_due')
      .on(table.next_run_at)
      .where(sql`enabled = true`),
  ],
);

/**
 * One row per generated report (scheduled or manual). Doubles as the run
 * record: the unique `(schedule_id, scheduled_for)` pair is the idempotency
 * gate that guarantees an occurrence is executed at most once, and
 * `attempts`/`error`/`delivery_status` surface the outcome in the history UI.
 * Holds the Vercel Blob pathname of the stored PDF and its expiry; the
 * retention job clears the blob and marks the row expired once past
 * `expires_at`.
 */
export const ReportHistoryTable = pgTable(
  'report_history',
  {
    report_id: uuid().primaryKey().defaultRandom(),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    schedule_id: uuid().references(() => ReportScheduleTable.schedule_id, {
      onDelete: 'set null',
    }),
    /** The planned occurrence this run executed (null for ad-hoc emails). */
    scheduled_for: timestamp({ withTimezone: true }),
    interval: reportIntervalEnum().notNull(),
    period: text().notNull(),
    status: reportStatusEnum().notNull().default(ReportStatus.PENDING),
    trigger: reportTriggerEnum().notNull(),
    attempts: integer().notNull().default(0),
    error: text(),
    pathname: text(),
    filename: text(),
    resend_email_id: text(),
    /** From the Resend webhook: delivered | bounced | complained | ... */
    delivery_status: text().$type<EmailStatus>(),
    started_at: timestamp({ withTimezone: true }),
    completed_at: timestamp({ withTimezone: true }),
    expires_at: timestamp({ withTimezone: true }),
    created_at,
  },
  (table) => [
    // Idempotency: one execution per (schedule, occurrence). NULL
    // schedule_id rows (ad-hoc emails) never collide in Postgres.
    uniqueIndex('unique_report_run_occurrence').on(
      table.schedule_id,
      table.scheduled_for,
    ),
  ],
);

export const ReportScheduleRelations = relations(
  ReportScheduleTable,
  ({ one, many }) => ({
    team: one(TeamTable, {
      fields: [ReportScheduleTable.team_id],
      references: [TeamTable.team_id],
    }),
    history: many(ReportHistoryTable),
  }),
);

export const ReportHistoryRelations = relations(
  ReportHistoryTable,
  ({ one }) => ({
    team: one(TeamTable, {
      fields: [ReportHistoryTable.team_id],
      references: [TeamTable.team_id],
    }),
    schedule: one(ReportScheduleTable, {
      fields: [ReportHistoryTable.schedule_id],
      references: [ReportScheduleTable.schedule_id],
    }),
  }),
);

export type ReportSchedule = typeof ReportScheduleTable.$inferSelect;
export type InsertReportSchedule = typeof ReportScheduleTable.$inferInsert;

export type ReportHistory = typeof ReportHistoryTable.$inferSelect;
export type InsertReportHistory = typeof ReportHistoryTable.$inferInsert;
