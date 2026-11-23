import env from '@env';
import { MediaKind } from '@/utils/enum';

export type DriveMedia = {
  id: string;
  name: string;
  kind: MediaKind;
  /** Signed thumbnail URL; append `=s{px}`. */
  thumbnail: Nullable<string>;
  /** Displayed aspect ratio; `null` until Drive measures it. */
  ratio: Nullable<number>;
};

type Dimensions = { width?: number; height?: number; rotation?: number };

/** Displayed aspect ratio; a quarter turn (rotation 1 or 3) swaps the sides. */
function aspectRatio(dimensions?: Dimensions): Nullable<number> {
  const { width, height, rotation = 0 } = dimensions ?? {};
  if (!width || !height) return null;
  return rotation % 2 ? height / width : width / height;
}

const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

/**
 * @description Lists photos and videos from a publicly shared Drive folder.
 * Callers can then use Drive's embedded folder view.
 * @returns `null` if the API key is missing or Drive refuses access.
 */
export async function listDriveFolder(
  folder_id: string,
): Promise<Nullable<Array<DriveMedia>>> {
  if (!env.GOOGLE_API_KEY) return null;

  const params = new URLSearchParams({
    q: `'${folder_id}' in parents and trashed = false`,
    fields:
      'files(id,name,mimeType,thumbnailLink,imageMediaMetadata(width,height,rotation),videoMediaMetadata(width,height))',
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
        imageMediaMetadata?: Dimensions;
        videoMediaMetadata?: Dimensions;
      }>;
    };

    return files.flatMap((file) => {
      const { id, name, mimeType, thumbnailLink } = file;
      const kind = mimeType.split('/')[0];
      if (kind !== MediaKind.IMAGE && kind !== MediaKind.VIDEO) return [];
      // Drive appends a size (`=s220`); strip it so callers pick their own.
      const thumbnail = thumbnailLink?.replace(/=s\d+$/, '') ?? null;
      const ratio = aspectRatio(
        kind === MediaKind.VIDEO
          ? file.videoMediaMetadata
          : file.imageMediaMetadata,
      );
      return [{ id, name, kind, thumbnail, ratio }];
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
 * @description Streams a public Drive file with Range support.
 * @return `null` without an API key or if Drive refuses the file.
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
