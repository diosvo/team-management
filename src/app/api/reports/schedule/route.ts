import { NextRequest, NextResponse } from 'next/server';

import { claimDueSchedules } from '@/db/report';
import { getServiceCookies } from '@/lib/report';
import { executeSchedule } from '@/lib/report-schedule';
import { isAuthorizedCron, requestOrigin } from '@/lib/request';
import { ReportTrigger } from '@/utils/enum';

export const maxDuration = 300; // in seconds

/**
 * Wall-clock budget for one tick, with headroom under `maxDuration` so the
 * final run always finishes writing. Schedules are processed until the budget
 * runs out rather than up to a fixed count: a slow render then costs one
 * skipped schedule instead of a timeout in the middle of a run. Leftovers are
 * safe — the next tick finds them still overdue — but with a daily tick that
 * means tomorrow, so the budget is spent, not a fixed batch size.
 */
const TICK_BUDGET_MS = 240_000;

/** Rows claimed per query, run sequentially — puppeteer is memory-hungry. */
const CLAIM_SIZE = 3;

/**
 * Daily tick (08:00 ICT): claim schedules whose precomputed `next_run_at` has
 * passed and run each through `executeSchedule` — the same path "Run now"
 * uses. Each occurrence is guarded by the unique run index, so overlapping or
 * replayed invocations can never double-send.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const request = requestOrigin(req.headers);
  if (!request) {
    return NextResponse.json({ error: 'Missing host header' }, { status: 400 });
  }

  const started = Date.now();
  const results = [];
  // A schedule whose run could not be recorded keeps its `next_run_at`, so it
  // would be claimed again on the next pass — track what this tick touched to
  // spend the budget on new work instead.
  const seen = new Set<string>();
  let cookies: Array<{ name: string; value: string }> | undefined;

  while (Date.now() - started < TICK_BUDGET_MS) {
    const claimed = await claimDueSchedules(CLAIM_SIZE);
    const due = claimed.filter(({ schedule_id }) => !seen.has(schedule_id));

    if (due.length === 0) break;

    if (!cookies) {
      try {
        cookies = await getServiceCookies();
      } catch (error) {
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 500 },
        );
      }
    }

    for (const schedule of due) {
      seen.add(schedule.schedule_id);

      // `scheduled_for` is the planned occurrence, never `now()`: retries and
      // late ticks must produce identical report content and idempotency keys.
      results.push(
        await executeSchedule({
          schedule,
          scheduled_for: schedule.next_run_at,
          trigger: ReportTrigger.SCHEDULED,
          ...request,
          cookies,
        }),
      );

      if (Date.now() - started >= TICK_BUDGET_MS) break;
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No schedules due' });
  }

  return NextResponse.json({ processed: results.length, results });
}
