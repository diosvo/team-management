import { del, get, put } from '@vercel/blob';
import { fromUint8Array } from 'js-base64';

import { deleteFile, getFile, uploadFile } from './blob';

vi.mock('@vercel/blob', () => ({
  del: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

describe('getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns a base64 data URL for the fetched file', async () => {
    vi.mocked(get).mockResolvedValue({
      stream: 'hello',
      blob: { contentType: 'image/png' },
    } as unknown as Awaited<ReturnType<typeof get>>);

    const result = await getFile('users/1/avatar.png');

    expect(get).toHaveBeenCalledWith('users/1/avatar.png', {
      access: 'private',
    });
    expect(result).toBe(
      `data:image/png;base64,${fromUint8Array(new TextEncoder().encode('hello'))}`,
    );
  });

  test('falls back to a generic content type when none is provided', async () => {
    vi.mocked(get).mockResolvedValue({
      stream: 'hello',
      blob: { contentType: '' },
    } as unknown as Awaited<ReturnType<typeof get>>);

    const result = await getFile('users/1/avatar.png');

    expect(result).toBe(
      `data:application/octet-stream;base64,${fromUint8Array(new TextEncoder().encode('hello'))}`,
    );
  });

  test('returns null when the result has no stream', async () => {
    vi.mocked(get).mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof get>>,
    );

    expect(await getFile('users/1/avatar.png')).toBeNull();
  });

  test('propagates the error when fetching throws', async () => {
    const error = new Error('network');
    vi.mocked(get).mockRejectedValue(error);

    await expect(getFile('users/1/avatar.png')).rejects.toThrow(error);
  });
});

describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

  test('uploads with private access, a random suffix, and merged options', async () => {
    const blob = { pathname: 'users/1/avatar-xyz.png' };
    vi.mocked(put).mockResolvedValue(blob as Awaited<ReturnType<typeof put>>);

    const result = await uploadFile('users/1', file, {
      contentType: 'image/png',
    });

    expect(put).toHaveBeenCalledWith('users/1', file, {
      access: 'private',
      addRandomSuffix: true,
      contentType: 'image/png',
    });
    expect(result).toBe(blob);
  });

  test('propagates the error when the upload fails', async () => {
    const error = new Error('upload failed');
    vi.mocked(put).mockRejectedValue(error);

    await expect(uploadFile('users/1', file)).rejects.toThrow(error);
  });
});

describe('deleteFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes the file at the given path', async () => {
    vi.mocked(del).mockResolvedValue(undefined);

    await deleteFile('users/1/avatar.png');

    expect(del).toHaveBeenCalledWith('users/1/avatar.png');
  });

  test('propagates the error when the delete fails', async () => {
    const error = new Error('delete failed');
    vi.mocked(del).mockRejectedValue(error);

    await expect(deleteFile('users/1/avatar.png')).rejects.toThrow(error);
  });
});
