# Report Scheduler — Implementation Guide (v2)

**Project:** Saigon Rovers Basketball Club Portal
**Feature:** Recurring, scheduled email delivery of the analytics report (currently manual via the "Email Analytics Report" modal).
**Stack:** Next.js 16 on Vercel · Drizzle ORM + Postgres · Resend · puppeteer-core + @sparticuz/chromium-min · @vercel/blob · date-fns + @date-fns/tz · better-auth.

---

## Decisions (locked for v1)

These were settled during design review. Don't relitigate them mid-build.

| #   | Decision                                                                                     | Rationale                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| D1  | **Daily cron tick, not 15-minute.** One cron at `0 1 * * *` UTC (= 08:00 ICT).               | Reports are weekly/monthly; nobody needs minute-level send times. Works on any Vercel plan.                                                                          |
| D2  | **All reports send at a fixed hour (08:00 ICT). No per-schedule time picker.**               | A daily tick cannot honor arbitrary `hour:minute` — keeping the picker while ticking daily silently breaks. Schema stores frequency + day only.                      |
| D3  | **Schedules are DB rows; the tick polls `next_run_at`.** Never one Vercel cron per schedule. | Schedules become CRUD data; cron config never changes when users add/edit schedules.                                                                                 |
| D4  | **Data window derives from `scheduledFor`, never `now()`.**                                  | Retries and late ticks must produce identical report content ("last completed week relative to Monday").                                                             |
| D5  | **In-process retries (2–3 attempts inside the tick), not next-tick retries.**                | With a daily tick, a next-tick retry means tomorrow. Transient Resend/network failures must be absorbed within the invocation.                                       |
| D6  | **Store PDFs in Vercel Blob, with 90-day retention.**                                        | Enables download button, resend, and audit ("what exactly was sent"). Retention bounds cost.                                                                         |
| D7  | **Run history in our own `report_runs` table, no queue library.**                            | Status tracking is product-facing (recipients, PDF link, error shown in UI). Simplified state machine: `pending → running → sent                                     | failed`. No `queue`, no `retrying` state. |
| D8  | **CRUD via server actions; the cron target is a route handler.**                             | Server actions aren't URLs — Vercel Cron makes a plain HTTP GET, so it needs `app/api/cron/reports/route.ts`. Both paths call the same internal `executeSchedule()`. |
| D9  | **No duplicate schedules — merge recipients instead.**                                       | Per requirements: same reportType + frequency + day must not exist twice; the UI offers "add recipients to the existing schedule".                                   |
| D10 | **No job prioritization.**                                                                   | A handful of schedules, ≤ ~20 recipients. Everything due in a tick just runs sequentially.                                                                           |

**Upgrade triggers (when to revisit):** the first time-sensitive schedule (e.g. match reminders) or a real user need for custom send times → change the cron to `*/15 * * * *` or every minute (Pro), re-add `hour`/`minute` columns, expose a time picker. The execution logic below does not change. If you also want per-step retries and a runs dashboard without building them, adopt Inngest at that point and wrap the steps of `executeSchedule` in `step.run()`.

---

## Step 1 — Schema and migration

Create `src/drizzle/schema/report-scheduler.ts`:

```ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const frequencyEnum = pgEnum('report_frequency', ['weekly', 'monthly']);
export const runStatusEnum = pgEnum('report_run_status', [
  'pending',
  'running',
  'sent',
  'failed',
]);

export const reportSchedules = pgTable(
  'report_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(), // "Weekly analytics report"
    reportType: text('report_type').notNull().default('analytics'),
    reportConfig: jsonb('report_config')
      .$type<{ sections?: string[] }>()
      .default({}),
    recipients: jsonb('recipients').$type<string[]>().notNull(),
    frequency: frequencyEnum('frequency').notNull(),
    dayOfWeek: integer('day_of_week'), // 0–6 (Sun–Sat), required when weekly
    dayOfMonth: integer('day_of_month'), // 1–28 only, required when monthly
    timezone: text('timezone').notNull().default('Asia/Ho_Chi_Minh'),
    enabled: boolean('enabled').notNull().default(true),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(), // UTC, precomputed
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Tick query: index only enabled rows (partial index).
    index('idx_schedules_due')
      .on(t.nextRunAt)
      .where(sql`enabled = true`),
    // D9: no duplicate schedule slots. NULLs are distinct in Postgres, so
    // coalesce day columns to make weekly/weekly and monthly/monthly collide.
    uniqueIndex('uq_schedule_slot')
      .on(
        t.reportType,
        t.frequency,
        sql`coalesce(${t.dayOfWeek}, -1)`,
        sql`coalesce(${t.dayOfMonth}, -1)`,
      )
      .where(sql`enabled = true`),
  ],
);

export const reportRuns = pgTable(
  'report_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scheduleId: uuid('schedule_id')
      .references(() => reportSchedules.id, { onDelete: 'cascade' })
      .notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    status: runStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    error: text('error'),
    pdfUrl: text('pdf_url'),
    resendEmailId: text('resend_email_id'),
    deliveryStatus: text('delivery_status'), // from Resend webhook: delivered | bounced | complained
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    // Idempotency: one execution per (schedule, occurrence). Ever.
    uniqueIndex('uq_run_occurrence').on(t.scheduleId, t.scheduledFor),
  ],
);
```

Then:

```bash
pnpm db:generate
pnpm db:migrate
```

Checklist for this step:

- [ ] UI/zod must restrict `dayOfMonth` to 1–28 (D2 avoids the 29–31 monthly bug).
- [ ] `nextRunAt` is set at insert time by `computeNextRun` (Step 2) — never nullable, never defaulted.

## Step 2 — Next-run computation (timezone-correct)

Create `src/lib/report-scheduler/next-run.ts`. Compute the next occurrence **in the schedule's timezone**, then return the UTC instant. Never do calendar math in UTC.

```ts
import { TZDate } from '@date-fns/tz';
import { addDays, addMonths, setDate } from 'date-fns';

export const SEND_HOUR_LOCAL = 8; // D2: everything sends at 08:00 local (ICT)

export function computeNextRun(
  s: Pick<
    ReportSchedule,
    'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'timezone'
  >,
  after: Date,
): Date {
  const local = new TZDate(after, s.timezone);
  let next = new TZDate(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    SEND_HOUR_LOCAL,
    0,
    0,
    s.timezone,
  );

  if (s.frequency === 'weekly') {
    const delta = (s.dayOfWeek! - next.getDay() + 7) % 7;
    next = addDays(next, delta);
    if (next <= local) next = addDays(next, 7);
  } else {
    // monthly
    next = setDate(next, s.dayOfMonth!);
    if (next <= local) next = setDate(addMonths(next, 1), s.dayOfMonth!);
  }
  return new Date(next);
}
```

Also add the **data-window derivation** (D4) here, keyed off `scheduledFor`:

```ts
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from 'date-fns';

export function reportWindow(
  frequency: 'weekly' | 'monthly',
  scheduledFor: Date,
  tz: string,
) {
  const local = new TZDate(scheduledFor, tz);
  if (frequency === 'weekly') {
    const prev = subWeeks(local, 1);
    return {
      from: startOfWeek(prev, { weekStartsOn: 1 }),
      to: endOfWeek(prev, { weekStartsOn: 1 }),
    };
  }
  const prev = subMonths(local, 1);
  return { from: startOfMonth(prev), to: endOfMonth(prev) };
}
```

Checklist:

- [ ] Unit tests: weekly wrap-around (created on the send day _after_ 08:00 → next week), month boundary (Jan 31 → Feb), monthly on the 28th, and one DST timezone (`America/New_York`) to prove the TZDate approach — Vietnam has no DST, but recipients elsewhere might someday.
- [ ] Unit tests for `reportWindow`: a Monday `scheduledFor` yields the previous Mon–Sun; the 1st yields the full previous month.

## Step 3 — Extract the shared execution path

Refactor the existing manual "Generate & Email" logic so manual and scheduled sends share one code path:

- `generateAnalyticsPdf(config, window): Promise<Buffer>` — the current puppeteer-core + chromium-min render, now parameterized by the data window from Step 2.
- `sendReportEmail({ schedule, pdfBuffer | pdfUrl, scheduledFor }): Promise<{ resendEmailId }>` — the Resend call. If the PDF exceeds ~35 MB, skip the attachment and send the Blob link only (Resend's cap is 40 MB total).

Checklist:

- [ ] The manual modal's "Generate & Email" now calls these two functions with `scheduledFor = now()` and a user-picked window. No behavior change for users.

## Step 4 — `executeSchedule` (the core, with D5 retries)

Create `src/lib/report-scheduler/execute.ts`. Order of operations matters — follow it exactly:

```ts
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [5_000, 20_000]; // in-process backoff between attempts

export async function executeSchedule(
  schedule: ReportSchedule,
  scheduledFor: Date,
) {
  // 1. IDEMPOTENCY GATE — insert the run row FIRST. A unique violation means
  //    this occurrence was already executed (overlapping tick, manual re-fire,
  //    or a malicious hit on the cron URL): skip silently.
  let run: ReportRun;
  try {
    [run] = await db
      .insert(reportRuns)
      .values({
        scheduleId: schedule.id,
        scheduledFor,
        status: 'running',
        startedAt: new Date(),
        attempts: 0,
      })
      .returning();
  } catch {
    return { scheduleId: schedule.id, outcome: 'skipped_duplicate' as const };
  }

  const window = reportWindow(
    schedule.frequency,
    scheduledFor,
    schedule.timezone,
  );
  let pdfUrl: string | null = null;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await db
        .update(reportRuns)
        .set({ attempts: attempt })
        .where(eq(reportRuns.id, run.id));

      // 2. Generate + archive — SKIPPED on retry if the PDF already exists
      //    (poor man's step memoization: a Resend failure must not re-render).
      if (!pdfUrl) {
        const pdf = await generateAnalyticsPdf(schedule.reportConfig, window);
        const blob = await put(
          `reports/${schedule.id}/${scheduledFor.toISOString()}.pdf`,
          pdf,
          { access: 'public' },
        );
        pdfUrl = blob.url;
        await db
          .update(reportRuns)
          .set({ pdfUrl })
          .where(eq(reportRuns.id, run.id));
      }

      // 3. Send
      const { resendEmailId } = await sendReportEmail({
        schedule,
        pdfUrl,
        scheduledFor,
      });

      // 4. Success: close the run and advance the schedule atomically
      await db.transaction(async (tx) => {
        await tx
          .update(reportRuns)
          .set({ status: 'sent', resendEmailId, completedAt: new Date() })
          .where(eq(reportRuns.id, run.id));
        await tx
          .update(reportSchedules)
          .set({
            lastRunAt: new Date(),
            nextRunAt: computeNextRun(schedule, scheduledFor),
          })
          .where(eq(reportSchedules.id, schedule.id));
      });
      return { scheduleId: schedule.id, outcome: 'sent' as const };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
  }

  // 5. Final failure: record it, STILL advance the schedule (D5 — with a daily
  //    tick we do not retry tomorrow; a human recovers via Run Now), notify owner.
  await db.transaction(async (tx) => {
    await tx
      .update(reportRuns)
      .set({
        status: 'failed',
        error: String(lastError),
        completedAt: new Date(),
      })
      .where(eq(reportRuns.id, run.id));
    await tx
      .update(reportSchedules)
      .set({ nextRunAt: computeNextRun(schedule, scheduledFor) })
      .where(eq(reportSchedules.id, schedule.id));
  });
  await notifyOwnerOfFailure(schedule, run.id, lastError); // simple Resend email
  return { scheduleId: schedule.id, outcome: 'failed' as const };
}
```

Checklist:

- [ ] Budget: 3 attempts × (render ≤ ~30 s + delays) must fit inside the route's `maxDuration` (Step 5). Cap the per-tick `LIMIT` accordingly.
- [ ] `notifyOwnerOfFailure` links to the run in the history UI.

## Step 5 — The cron route

`app/api/cron/reports/route.ts`:

```ts
export const maxDuration = 300; // seconds; requires Vercel Pro. On Hobby: 60 max — lower LIMIT to 1–2.

export async function GET(req: Request) {
  if (
    req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Claim due schedules. SKIP LOCKED = overlapping invocations never grab
  // the same row; the unique run index is the second line of defense.
  const due = await db.transaction(async (tx) => {
    const rows = await tx.execute(sql`
      SELECT * FROM report_schedules
      WHERE enabled = true AND next_run_at <= now()
      ORDER BY next_run_at
      LIMIT 5
      FOR UPDATE SKIP LOCKED
    `);
    return rows.rows as ReportSchedule[];
  });

  const results = [];
  for (const s of due) {
    // Sequential on purpose: puppeteer is memory-hungry in a serverless fn.
    results.push(await executeSchedule(s, s.nextRunAt)); // scheduledFor = the planned time (D4)
  }
  return Response.json({ processed: results.length, results });
}
```

`vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/reports", "schedule": "0 1 * * *" }] }
```

`0 1 * * *` UTC = 08:00 Asia/Ho_Chi_Minh (no DST in Vietnam, so this never drifts). Vercel cron expressions are UTC-only.

Checklist:

- [ ] Set `CRON_SECRET` (≥ 16 random chars) in Vercel env vars — Vercel attaches it automatically to its cron invocations; your check rejects everyone else.
- [ ] **Hobby plan caveat:** the daily invocation may fire at any point within the scheduled hour, so "08:00" means "08:00–09:00 ICT". Acceptable per D1/D2; document it in the UI copy ("sent in the morning").
- [ ] Leftover work is safe by design: if a tick times out with due rows unclaimed, the next tick (tomorrow) picks them up — but because Step 4 always advances `nextRunAt`, a _claimed_ occurrence never re-fires.

## Step 6 — CRUD server actions (D8)

`src/app/(dashboard)/reports/schedules/actions.ts` — all `"use server"`, all behind the better-auth session check you use elsewhere:

- `createSchedule(input)` — zod-validate (weekly ⇒ `dayOfWeek` required; monthly ⇒ `dayOfMonth` 1–28); set `nextRunAt = computeNextRun(input, new Date())`. **On unique-violation of `uq_schedule_slot`** (D9): return a typed error `{ conflict: existingScheduleId }` so the UI can offer "Add your recipients to the existing schedule instead?" — `mergeRecipients(existingId, emails)` is its own action (dedupe with `es-toolkit`'s `uniq`).
- `updateSchedule(id, input)` — if frequency/day changed, recompute `nextRunAt`.
- `toggleSchedule(id, enabled)` — re-enabling recomputes `nextRunAt` from `now()` (never fire a backlog of missed occurrences).
- `deleteSchedule(id)` — cascade removes runs (blobs cleaned by Step 8's retention job).
- `runNow(scheduleId)` — calls `executeSchedule(schedule, new Date())`. This is both the manual-trigger feature and the human recovery path after a failure (D5). Note `scheduledFor = now()` here gives a distinct idempotency key from the scheduled occurrence, so Run Now after a failed 08:00 run works.

Checklist:

- [ ] `revalidatePath` on the schedules page after each mutation.
- [ ] Do **not** expose these as REST routes; the only public HTTP surface is the cron route and the webhook (Step 7).

## Step 7 — Resend delivery webhook

"Sent" from the API means _accepted_, not _delivered_. Add `app/api/webhooks/resend/route.ts`:

1. Verify the webhook signature (Resend signs with Svix headers — verify before trusting the payload).
2. On `email.delivered` / `email.bounced` / `email.complained`, look up `report_runs` by `resendEmailId` and set `deliveryStatus`.
3. Configure the endpoint + events in the Resend dashboard.

Checklist:

- [ ] History UI (Step 8) shows `sent + delivered` as green, `sent + bounced` as amber with the bounce reason.

## Step 8 — UI

1. **Extend the existing "Email Analytics Report" modal** with a second tab, "Schedule": frequency toggle (Weekly / Monthly) → weekday or day-of-month picker (1–28) → the existing recipients combobox → enabled switch. Copy states: "Reports are emailed in the morning (around 8:00 AM)."
2. **Scheduled Reports page** (list): name, frequency ("Weekly · Mondays"), recipients count, next run (render `nextRunAt` in ICT), last run status chip, actions: Run now / Pause / Edit / Delete.
3. **History drawer** per schedule, backed by `report_runs`: occurrence date, status, delivery status, attempts, PDF download link, error text.
4. Data fetching via your existing SWR pattern; forms via react-hook-form + zod resolvers, matching the rest of the app.

## Step 9 — Blob retention (D6)

Add a cleanup at the top of the same cron route (cheap, piggybacks the daily tick):

```ts
// Delete PDFs for runs older than 90 days, then null out pdf_url.
const stale = await db
  .select()
  .from(reportRuns)
  .where(
    and(
      lt(reportRuns.completedAt, subDays(new Date(), 90)),
      isNotNull(reportRuns.pdfUrl),
    ),
  )
  .limit(20);
for (const r of stale) {
  await del(r.pdfUrl!);
}
await db
  .update(reportRuns)
  .set({ pdfUrl: null })
  .where(
    inArray(
      reportRuns.id,
      stale.map((r) => r.id),
    ),
  );
```

Keep the run rows themselves forever — they're tiny and they're your audit log.

## Step 10 — Tests

Vitest (unit):

- [ ] `computeNextRun`: weekly wrap-around, monthly month-boundary, day-28, created-after-send-hour, `America/New_York` DST case.
- [ ] `reportWindow`: Monday → previous Mon–Sun; 1st → previous full month; derived from `scheduledFor`, not wall clock (freeze time with `vi.setSystemTime`).

Integration (Vitest against a test DB):

- [ ] **Idempotency:** call `executeSchedule` twice with the same `(scheduleId, scheduledFor)` → exactly one email send (mock Resend), second call returns `skipped_duplicate`.
- [ ] **Retry memoization:** fail the Resend mock on attempt 1 → attempt 2 must not call `generateAnalyticsPdf` again (PDF url reused).
- [ ] **Final failure:** all attempts fail → run is `failed`, `nextRunAt` still advanced, owner notification sent.
- [ ] **Conflict:** creating a second Weekly/Monday analytics schedule → typed conflict error, `mergeRecipients` dedupes.

Playwright (e2e): create a schedule via the modal, see it listed with the correct next run, click Run now, see a run row appear.

## Step 11 — Deploy & verify

1. Env vars on Vercel: `CRON_SECRET`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, Resend webhook secret.
2. Deploy; confirm the cron appears under Project → Settings → Cron Jobs.
3. Manually hit the route once with the bearer secret (`curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/reports`) — expect `{ processed: 0 }`.
4. Create a test schedule for tomorrow, or temporarily set its `nextRunAt` to the past via `db:studio` and hit the route again — expect one email, one `sent` run, `nextRunAt` advanced.
5. Watch the first real morning tick in Vercel's function logs.

---

## Appendix A — Why these choices (short form)

- **Polling `next_run_at` vs. fixed intervals / one-time-delay chains:** calendar periods aren't fixed-length (months are 28–31 days), so no millisecond interval encodes "1st of the month"; delay chains die silently if one link fails and need reconciliation anyway. Precomputed `next_run_at` + a partial index makes the tick query an O(due-rows) index read, and a missed/crashed tick self-heals: the overdue row is simply found by the next tick.
- **Daily tick vs. 15-minute:** with fixed 08:00 sends (D2), finer ticks buy nothing except faster cross-tick retries — which D5's in-process retries replace. The upgrade is a one-line cron change if requirements change.
- **Why the run-row insert comes first:** the unique `(scheduleId, scheduledFor)` insert is the idempotency gate; taking it before any side effect means overlapping ticks, replays, or hostile hits on the cron URL can never double-send.
- **Why the cron target is a route handler, not a server action:** Vercel Cron is an external system making a plain HTTP GET; server actions are RPC endpoints only your own app's client bundle can invoke.
- **Own `report_runs` table vs. a queue library's tables:** run history is product UI (PDF links, recipients, delivery status), not just ops telemetry; a library's internal schema isn't shaped for that. Adopt Inngest later for execution mechanics if needed — keep `report_runs` as the domain record regardless.

## Appendix B — Out of scope for v1 (deliberately)

Per-schedule send times · quarterly/yearly frequencies (add as new enum values + `computeNextRun` branches when asked) · custom date-range recurring reports (the manual modal covers ad-hoc ranges) · job prioritization · per-recipient fan-out · Inngest/QStash adoption.
