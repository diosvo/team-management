import env from '@env';

import { listDriveFolder, streamDriveFile } from './drive';

vi.mock('@env', () => ({ default: { GOOGLE_API_KEY: 'api-key' } }));

const FOLDER_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
const FILE_ID = '1ZyXwVuTsRqPoNmLkJiHgFeDcBa543210';

describe('listDriveFolder', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    env.GOOGLE_API_KEY = 'api-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('lists the photos and videos of the folder, skipping other files', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        files: [
          {
            id: 'a',
            name: 'IMG_0029.MOV',
            mimeType: 'video/quicktime',
            thumbnailLink:
              'https://lh3.googleusercontent.com/drive-storage/a=s220',
          },
          { id: 'b', name: 'IMG_0032.HEIC', mimeType: 'image/heif' },
          { id: 'c', name: 'notes.pdf', mimeType: 'application/pdf' },
        ],
      }),
    });

    expect(await listDriveFolder(FOLDER_ID)).toEqual([
      {
        id: 'a',
        name: 'IMG_0029.MOV',
        kind: 'video',
        // Size suffix stripped so the UI can ask for its own.
        thumbnail: 'https://lh3.googleusercontent.com/drive-storage/a',
      },
      { id: 'b', name: 'IMG_0032.HEIC', kind: 'image', thumbnail: null },
    ]);

    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.origin + url.pathname).toBe(
      'https://www.googleapis.com/drive/v3/files',
    );
    expect(url.searchParams.get('q')).toBe(
      `'${FOLDER_ID}' in parents and trashed = false`,
    );
    expect(url.searchParams.get('key')).toBe('api-key');
  });

  test('returns null without an API key, without calling Drive', async () => {
    env.GOOGLE_API_KEY = '';

    expect(await listDriveFolder(FOLDER_ID)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns null when Drive refuses the folder', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    expect(await listDriveFolder(FOLDER_ID)).toBeNull();
  });

  test('returns null when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    expect(await listDriveFolder(FOLDER_ID)).toBeNull();
  });
});

describe('streamDriveFile', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    env.GOOGLE_API_KEY = 'api-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('forwards the range and passes the media headers through', async () => {
    fetchMock.mockResolvedValue(
      new Response('bytes', {
        status: 206,
        headers: {
          'content-type': 'video/quicktime',
          'content-range': 'bytes 0-4/100',
          'accept-ranges': 'bytes',
          'x-goog-hash': 'skip-me',
        },
      }),
    );

    const response = await streamDriveFile(FILE_ID, 'bytes=0-');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media&key=api-key`,
    );
    expect(init).toEqual({ headers: { range: 'bytes=0-' } });
    expect(response?.status).toBe(206);
    expect(response?.headers.get('content-type')).toBe('video/quicktime');
    expect(response?.headers.get('content-range')).toBe('bytes 0-4/100');
    expect(response?.headers.get('cache-control')).toBe(
      'private, max-age=3600',
    );
    expect(response?.headers.has('x-goog-hash')).toBe(false);
    expect(await response?.text()).toBe('bytes');
  });

  test('sends no range header for a full request', async () => {
    fetchMock.mockResolvedValue(new Response('bytes'));

    await streamDriveFile(FILE_ID, null);

    expect(fetchMock.mock.calls[0]![1]).toEqual({ headers: undefined });
  });

  test('returns null without an API key', async () => {
    env.GOOGLE_API_KEY = '';

    expect(await streamDriveFile(FILE_ID, null)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns null when Drive refuses the file', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));

    expect(await streamDriveFile(FILE_ID, null)).toBeNull();
  });

  test('returns null when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    expect(await streamDriveFile(FILE_ID, null)).toBeNull();
  });
});
