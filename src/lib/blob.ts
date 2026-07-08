import { del, get, put, PutCommandOptions } from '@vercel/blob';
import { fromUint8Array } from 'js-base64';

export async function getFile(pathname: string): Promise<Nullable<string>> {
  const result = await get(pathname, { access: 'private' });

  if (!result?.stream) return null;

  const bytes = new Uint8Array(await new Response(result.stream).arrayBuffer());
  const contentType = result.blob.contentType || 'application/octet-stream';

  return `data:${contentType};base64,${fromUint8Array(bytes)}`;
}

export async function uploadFile(
  pathname: string,
  file: File,
  options: Omit<PutCommandOptions, 'access' | 'addRandomSuffix'> = {},
) {
  return await put(pathname, file, {
    access: 'private',
    addRandomSuffix: true,
    ...options,
  });
}

export async function deleteFile(pathname: string) {
  await del(pathname);
}
