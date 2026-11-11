import { type NextRequest, NextResponse } from 'next/server';

import { deleteFile } from '@/lib/blob';
import { isAuthorizedCron } from '@/lib/request';

import { selectExpiredReports, updateExpiredReports } from '@/db/report';

export const maxDuration = 60; // in seconds

/**
 * Retention job: delete blobs of reports past their expiry and mark the rows
 * expired so they drop off the download list. Blob deletes run in parallel;
 * rows whose delete failed are left for the next run.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expired = await selectExpiredReports(new Date());

  const deletions = await Promise.allSettled(
    expired.map((report) => deleteFile(report.pathname!)),
  );
  const purged = expired
    .filter((_, index) => deletions[index]?.status === 'fulfilled')
    .map((report) => report.report_id);

  if (purged.length > 0) {
    await updateExpiredReports(purged);
  }

  return NextResponse.json({ purged: purged.length });
}
