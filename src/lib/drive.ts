import env from '@env';

export type DriveMedia = {
  id: string;
  name: string;
  kind: 'image' | 'video';
  /**
   * Signed thumbnail URL from the Drive API, without its size suffix (append
   * `=s{px}`). Served cookie-free, unlike `drive.google.com/thumbnail`.
   */
  thumbnail: Nullable<string>;
};

const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

/**
 * @description Lists the photos and videos of a Drive folder shared as
 * "Anyone with the link". Returns `null` when no API key is configured or
 * Drive refuses (private/removed folder), so callers can fall back to Drive's
 * embedded folder view.
 */
export async function listDriveFolder(
  folder_id: string,
): Promise<Nullable<Array<DriveMedia>>> {
  if (!env.GOOGLE_API_KEY) return null;

  const params = new URLSearchParams({
    q: `'${folder_id}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,thumbnailLink)',
    orderBy: 'name',
    pageSize: '200',
    key: env.GOOGLE_API_KEY,
  });

  try {
    const response = await fetch(`${FILES_ENDPOINT}?${params}`);
    if (!response.ok) return null;

    const { files } = (await response.json()) as {
      files: Array<{
        id: string;
        name: string;
        mimeType: string;
        thumbnailLink?: string;
      }>;
    };

    return files.flatMap(({ id, name, mimeType, thumbnailLink }) => {
      const kind = mimeType.split('/')[0];
      if (kind !== 'image' && kind !== 'video') return [];
      // Drive appends a size (`=s220`); strip it so callers pick their own.
      const thumbnail = thumbnailLink?.replace(/=s\d+$/, '') ?? null;
      return [{ id, name, kind, thumbnail }];
    });
  } catch {
    return null;
  }
}

/** Response headers worth passing through when streaming a Drive file. */
const STREAM_HEADERS = [
  'accept-ranges',
  'content-length',
  'content-range',
  'content-type',
];

/**
 * @description Streams a public Drive file (Drive API `alt=media`), forwarding
 * the `Range` header so a `<video>` can seek. Returns `null` without an API key
 * or when Drive refuses the file.
 */
export async function streamDriveFile(
  file_id: string,
  range: Nullable<string>,
): Promise<Nullable<Response>> {
  if (!env.GOOGLE_API_KEY) return null;

  const params = new URLSearchParams({ alt: 'media', key: env.GOOGLE_API_KEY });

  try {
    const upstream = await fetch(`${FILES_ENDPOINT}/${file_id}?${params}`, {
      headers: range ? { range } : undefined,
    });
    if (!upstream.ok) return null;

    const headers = new Headers({ 'cache-control': 'private, max-age=3600' });
    for (const name of STREAM_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return null;
  }
}
