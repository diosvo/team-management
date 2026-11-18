import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  deleteFile,
  detectContentType,
  getFile,
  getFileBytes,
  resolveStoragePath,
  storageRoot,
  uploadFile,
} from './local-storage';

const env = vi.hoisted(() => ({ UPLOAD_DIR: '' }));
vi.mock('@env', () => ({ default: env }));

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a];
const bytes = (...values: Array<number>) => new Uint8Array(values);

beforeEach(async () => {
  env.UPLOAD_DIR = await mkdtemp(path.join(tmpdir(), 'storage-'));
});

afterEach(async () => {
  await rm(env.UPLOAD_DIR, { recursive: true, force: true });
});

describe('resolveStoragePath', () => {
  test('resolves a pathname inside the storage root', () => {
    expect(resolveStoragePath('users/1/a.webp')).toBe(
      path.join(storageRoot(), 'users', '1', 'a.webp'),
    );
  });

  test.each(['../secret', 'users/../../secret', '/etc/passwd', '', '.'])(
    'rejects %j as escaping the storage root',
    (pathname) => {
      expect(() => resolveStoragePath(pathname)).toThrow(
        'Invalid storage path',
      );
    },
  );
});

describe('uploadFile', () => {
  test('writes the bytes under a UUID name and returns the pathname', async () => {
    const { pathname } = await uploadFile('users/1', bytes(...PNG), 'png');

    expect(pathname).toMatch(/^users\/1\/[0-9a-f-]{36}\.png$/);
    expect(await readdir(path.join(env.UPLOAD_DIR, 'users', '1'))).toEqual([
      path.basename(pathname),
    ]);
    expect(Array.from((await getFileBytes(pathname))!)).toEqual(PNG);
  });

  test('gives every upload a distinct pathname', async () => {
    const first = await uploadFile('teams/1', bytes(1), 'webp');
    const second = await uploadFile('teams/1', bytes(1), 'webp');

    expect(first.pathname).not.toBe(second.pathname);
  });
});

describe('getFileBytes', () => {
  test('returns null for a missing file', async () => {
    expect(await getFileBytes('users/missing.webp')).toBeNull();
  });

  test('propagates errors other than a missing file', async () => {
    await uploadFile('users/1', bytes(1), 'webp');

    // Reading a directory fails with EISDIR, not ENOENT
    await expect(getFileBytes('users/1')).rejects.toThrow();
  });
});

describe('getFile', () => {
  test('returns a data URL typed from the file bytes', async () => {
    const { pathname } = await uploadFile('users/1', bytes(...PNG), 'png');

    expect(await getFile(pathname)).toBe(
      `data:image/png;base64,${Buffer.from(PNG).toString('base64')}`,
    );
  });

  test('returns null for a missing file', async () => {
    expect(await getFile('users/missing.webp')).toBeNull();
  });
});

describe('deleteFile', () => {
  test('removes the file', async () => {
    const { pathname } = await uploadFile('reports', bytes(1), 'pdf');

    await deleteFile(pathname);

    expect(await getFileBytes(pathname)).toBeNull();
  });

  test('ignores a file that is already gone', async () => {
    await expect(deleteFile('reports/gone.pdf')).resolves.toBeUndefined();
  });

  test('refuses a path outside the storage root', async () => {
    await expect(deleteFile('../outside')).rejects.toThrow(
      'Invalid storage path',
    );
  });
});

describe('detectContentType', () => {
  const webp = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

  test.each([
    ['PNG', PNG, 'image/png'],
    ['JPEG', [0xff, 0xd8, 0xff, 0xe0], 'image/jpeg'],
    ['WebP', webp, 'image/webp'],
    [
      'RIFF that is not WebP',
      [...webp.slice(0, 8), 0x57, 0x41, 0x56, 0x45],
      'application/octet-stream',
    ],
    ['PDF', [0x25, 0x50, 0x44, 0x46, 0x2d], 'application/pdf'],
    ['unknown bytes', [0x00, 0x01], 'application/octet-stream'],
  ])('detects %s', (_, signature, expected) => {
    expect(detectContentType(bytes(...signature))).toBe(expected);
  });
});
