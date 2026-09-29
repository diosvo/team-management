import { type NextRequest, NextResponse } from 'next/server';

import { DRIVE_ID_PATTERN } from '@/utils/drive';

import { streamDriveFile } from '@/lib/drive';

import { verifySession } from '@/actions/auth';

/**
 * Streams a public Drive video to signed-in users so documents play in a
 * native `<video>`. Proxying keeps the API key on the server; the `Range`
 * header is forwarded so the player can seek without downloading everything.
 */
export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/drive/[id]'>,
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!DRIVE_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid Drive id' }, { status: 400 });
  }

  const stream = await streamDriveFile(id, req.headers.get('range'));

  return (
    stream ??
    NextResponse.json({ error: 'Drive file unavailable' }, { status: 404 })
  );
}
