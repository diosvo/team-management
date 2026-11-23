import { type NextRequest, NextResponse } from 'next/server';

import { DRIVE_ID_PATTERN } from '@/utils/drive';

import { streamDriveFile } from '@/lib/drive';

import { verifySession } from '@/actions/auth';

/**
 * Stream public Drive videos to signed-in users.
 * - Keep the API key on the server.
 * - Support native `<video>` playback and `Range` requests.
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
