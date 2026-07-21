import { NextRequest, NextResponse } from 'next/server';

import { claimDueSchedules } from '@/db/report';
import { getServiceCookies } from '@/lib/report';
import { executeSchedule } from '@/lib/report-schedule';
import { isAuthorizedCron, requestOrigin } from '@/lib/request';
import { ReportTrigger } from '@/utils/enum';

export const maxDuration = 300; // in seconds

/**
 * Wall-clock budget for one tick, with headroom under `maxDuration` so the
 * final run always finishes writing. Anything left over is still overdue on
 * the next daily tick.
 */
const TICK_BUDGET_MS = 240_000;

/** Upper bound of schedules claimed per tick (at most two per team). */
const CLAIM_SIZE = 20;

/**
 * Daily tick (08:00 ICT): claim schedules whose precomputed `next_run_at` has
 * passed and run each sequentially (puppeteer is memory-hungry) through
 * `executeSchedule` — the same path "Run now" uses. Each occurrence is guarded
 * by the unique run index, so overlapping or replayed invocations can never
 * double-send. Most days nothing is due: schedules only fall on the 1st.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const request = requestOrigin(req.headers);
  if (!request) {
    return NextResponse.json({ error: 'Missing host header' }, { status: 400 });
  }

  const due = await claimDueSchedules(CLAIM_SIZE);
  if (due.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No schedules due' });
  }

  let cookies: Array<{ name: string; value: string }>;
  try {
    cookies = await getServiceCookies();
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }

  const started = Date.now();
  const results = [];

  for (const schedule of due) {
    if (Date.now() - started >= TICK_BUDGET_MS) break;

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
  }

  return NextResponse.json({ processed: results.length, results });
}
