import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fromUint8Array } from 'js-base64';

import env from '@env';

/** Absolute storage root. Keep it outside `public/`: files are private. */
export const storageRoot = (): string => path.resolve(env.UPLOAD_DIR);

/** Map a stored pathname to a file inside the storage root, or throw. */
export function resolveStoragePath(pathname: string): string {
  const root = storageRoot();
  const target = path.resolve(root, pathname);

  if (
    !target.startsWith(root + path.sep) ||
    /(^|[\\/])\.\.([\\/]|$)/.test(pathname)
  ) {
    throw new Error(`Invalid storage path: ${pathname}`);
  }

  return target;
}

const isNotFound = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException)?.code === 'ENOENT';

/** Content type from the file's leading bytes, so legacy suffix-less paths still work. */
export function detectContentType(bytes: Uint8Array): string {
  const startsWith = (signature: Array<number>, offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0x89, 0x50, 0x4e, 0x47])) return 'image/png';
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (
    startsWith([0x52, 0x49, 0x46, 0x46]) &&
    startsWith([0x57, 0x45, 0x42, 0x50], 8)
  )
    return 'image/webp';
  if (startsWith([0x25, 0x50, 0x44, 0x46])) return 'application/pdf';

  return 'application/octet-stream';
}

/** Raw bytes of a stored file, or `null` when it does not exist. */
export async function getFileBytes(
  pathname: string,
): Promise<Nullable<Uint8Array<ArrayBuffer>>> {
  try {
    return new Uint8Array(await readFile(resolveStoragePath(pathname)));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** A stored file as a base64 data URL, or `null` when it does not exist. */
export async function getFile(pathname: string): Promise<Nullable<string>> {
  const bytes = await getFileBytes(pathname);

  if (!bytes) return null;

  return `data:${detectContentType(bytes)};base64,${fromUint8Array(bytes)}`;
}

/** Store `data` as `<prefix>/<uuid>.<extension>` and return its pathname. */
export async function uploadFile(
  prefix: string,
  data: Uint8Array,
  extension: string,
): Promise<{ pathname: string }> {
  const pathname = path.posix.join(prefix, `${randomUUID()}.${extension}`);
  const target = resolveStoragePath(pathname);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data, { flag: 'wx' });

  return { pathname };
}

/** Delete a stored file. Missing files are ignored, so retries are safe. */
export async function deleteFile(pathname: string): Promise<void> {
  await rm(resolveStoragePath(pathname), { force: true });
}
