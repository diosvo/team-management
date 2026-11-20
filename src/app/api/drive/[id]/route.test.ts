import type { NextRequest } from 'next/server';

import { streamDriveFile } from '@/lib/drive';

import { verifySession } from '@/actions/auth';
import { MOCK_DRIVE_FILE_ID } from '@/test/mocks/document';
import { MOCK_USER } from '@/test/mocks/user';

import { GET } from './route';

vi.mock('@/actions/auth', () => ({ verifySession: vi.fn() }));
vi.mock('@/lib/drive', () => ({ streamDriveFile: vi.fn() }));

const request = (range?: string) =>
  ({
    headers: new Headers(range ? { range } : {}),
  }) as unknown as NextRequest;

const context = (id: string) =>
  ({ params: Promise.resolve({ id }) }) as RouteContext<'/api/drive/[id]'>;

describe('GET /api/drive/[id]', () => {
  const mockVerifySession = vi.mocked(verifySession);
  const mockStream = vi.mocked(streamDriveFile);

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ user: MOCK_USER } as never);
  });

  test('rejects anonymous requests', async () => {
    mockVerifySession.mockResolvedValue(null as never);

    const response = await GET(request(), context(MOCK_DRIVE_FILE_ID));

    expect(response.status).toBe(401);
    expect(mockStream).not.toHaveBeenCalled();
  });

  test('rejects a malformed id', async () => {
    const response = await GET(request(), context('../secret'));

    expect(response.status).toBe(400);
    expect(mockStream).not.toHaveBeenCalled();
  });

  test('streams the file with the requested range', async () => {
    const stream = new Response('bytes', { status: 206 });
    mockStream.mockResolvedValue(stream);

    const response = await GET(
      request('bytes=0-'),
      context(MOCK_DRIVE_FILE_ID),
    );

    expect(mockStream).toHaveBeenCalledWith(MOCK_DRIVE_FILE_ID, 'bytes=0-');
    expect(response).toBe(stream);
  });

  test('returns 404 when Drive has nothing to stream', async () => {
    mockStream.mockResolvedValue(null);

    const response = await GET(request(), context(MOCK_DRIVE_FILE_ID));

    expect(mockStream).toHaveBeenCalledWith(MOCK_DRIVE_FILE_ID, null);
    expect(response.status).toBe(404);
  });
});
