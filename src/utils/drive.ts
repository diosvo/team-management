import { DocumentType } from './enum';

export type DriveLink = {
  id: string;
  kind: 'folder' | 'file';
};

const DRIVE_ID = '([\\w-]{10,})';

/** A bare Drive item id, as parsed from a share link. */
export const DRIVE_ID_PATTERN = /^[\w-]{10,}$/;

/**
 * Share-link shapes Google hands out. Query strings (`?usp=sharing`) and
 * account prefixes (`/u/0/`) are tolerated.
 */
const PATTERNS: Array<{ kind: DriveLink['kind']; regex: RegExp }> = [
  {
    kind: 'folder',
    regex: new RegExp(
      `^https://drive\\.google\\.com/drive/(?:u/\\d+/)?folders/${DRIVE_ID}`,
    ),
  },
  {
    kind: 'file',
    regex: new RegExp(`^https://drive\\.google\\.com/file/d/${DRIVE_ID}`),
  },
  {
    kind: 'file',
    regex: new RegExp(
      `^https://docs\\.google\\.com/(?:document|spreadsheets|presentation|forms)/d/${DRIVE_ID}`,
    ),
  },
  {
    kind: 'file',
    regex: new RegExp(
      `^https://drive\\.google\\.com/(?:open|uc)\\?(?:[^#]*&)?id=${DRIVE_ID}`,
    ),
  },
];

/**
 * @description Extracts the Drive item id and whether it is a folder or file.
 * Returns `null` for anything that isn't a recognised Google Drive share link.
 */
export function parseDriveUrl(url: Nullish<string>): Nullable<DriveLink> {
  if (!url) return null;

  const trimmed = url.trim();

  for (const { kind, regex } of PATTERNS) {
    const match = trimmed.match(regex);
    if (match?.[1]) return { id: match[1], kind };
  }

  return null;
}

export const isDriveUrl = (url: Nullish<string>) => parseDriveUrl(url) !== null;

/** Videos and tactics are single video files that play in the app. */
export const isPlayable = (type: DocumentType) =>
  type === DocumentType.VIDEO || type === DocumentType.TACTIC;

/**
 * @description Best-guess document type from the link shape. Folders are
 * albums; single files default to videos (the common case) and can be changed
 * to `file` in the form.
 */
export function detectDocumentType(url: Nullish<string>): DocumentType {
  const link = parseDriveUrl(url);
  if (link?.kind === 'folder') return DocumentType.ALBUM;
  if (/docs\.google\.com/.test(String(url))) return DocumentType.FILE;
  return DocumentType.VIDEO;
}

/** Public thumbnail Google serves for files shared with "Anyone with the link". */
export const driveThumbnailUrl = (id: string, width = 400) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;

/**
 * @description Embeddable viewer for a public Drive item: a folder renders as a
 * photo grid, a file in Google's player/viewer (video, image, PDF, doc).
 * Neither needs an API key or OAuth, only "Anyone with the link" sharing.
 */
export const drivePreviewUrl = ({ id, kind }: DriveLink) =>
  kind === 'folder'
    ? `https://drive.google.com/embeddedfolderview?id=${id}#grid`
    : `https://drive.google.com/file/d/${id}/preview`;

/** Same-origin stream of a Drive file, for a native `<video>` (see `/api/drive/[id]`). */
export const driveStreamUrl = (id: string) => `/api/drive/${id}`;
