import { NextRequest, NextResponse } from 'next/server';

import { verifySession } from '@/actions/auth';
import { getReportById } from '@/db/report';
import { getFileBytes } from '@/lib/blob';
import { ReportStatus, UserRole } from '@/utils/enum';

export async function GET(req: NextRequest) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
  }

  const report = await getReportById(id);

  if (!report || !report.pathname || report.status === ReportStatus.EXPIRED) {
    return NextResponse.json(
      { error: 'Report not found or no longer available' },
      { status: 404 },
    );
  }

  const { user } = session;
  const isAdmin = user.role === UserRole.SUPER_ADMIN;
  if (!isAdmin && report.team_id !== user.team_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const bytes = await getFileBytes(report.pathname);
  if (!bytes) {
    return NextResponse.json(
      { error: 'Report file could not be read' },
      { status: 404 },
    );
  }

  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${report.filename ?? 'report.pdf'}`,
    },
  });
}
