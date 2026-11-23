import { DocumentType, DriveKind } from './enum';

export type DriveLink = {
  id: string;
  kind: DriveKind;
};

const DRIVE_ID = '[\\w-]{10,}';

/** A bare Drive item id, as parsed from a share link. */
export const DRIVE_ID_PATTERN = new RegExp(`^${DRIVE_ID}$`);

/**
 * Supports common Google Drive share-link formats.
 * - Accepts `?usp=sharing` query strings
 * - Accepts `/u/0/` account prefixes
 */
const PATTERNS: Array<{ kind: DriveKind; regex: RegExp }> = [
  {
    kind: DriveKind.FOLDER,
    regex: new RegExp(
      `^https://drive\\.google\\.com/drive/(?:u/\\d+/)?folders/(${DRIVE_ID})`,
    ),
  },
  {
    kind: DriveKind.FILE,
    regex: new RegExp(`^https://drive\\.google\\.com/file/d/(${DRIVE_ID})`),
  },
  {
    kind: DriveKind.FILE,
    regex: new RegExp(
      `^https://docs\\.google\\.com/(?:document|spreadsheets|presentation|forms)/d/(${DRIVE_ID})`,
    ),
  },
  {
    kind: DriveKind.FILE,
    regex: new RegExp(
      `^https://drive\\.google\\.com/(?:open|uc)\\?(?:[^#]*&)?id=(${DRIVE_ID})`,
    ),
  },
];

/**
 * Extracts the Drive item id and kind.
 * @return The Drive link, or `null` if the URL is not recognised.
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

/** @description Guesses the document type from the link shape. */
export function detectDocumentType(url: Nullish<string>): DocumentType {
  const link = parseDriveUrl(url);
  if (link?.kind === DriveKind.FOLDER) return DocumentType.ALBUM;
  if (/docs\.google\.com/.test(String(url))) return DocumentType.FILE;
  return DocumentType.VIDEO;
}

/** Public thumbnail Google serves for files shared with "Anyone with the link". */
export const driveThumbnailUrl = (id: string, width = 400) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;

/**
 * @description Returns an embeddable Drive preview.
 * - Folder: photo grid
 * - File: Google viewer
 * - Public access only; no API key or OAuth required
 */
export const drivePreviewUrl = ({ id, kind }: DriveLink) =>
  kind === DriveKind.FOLDER
    ? `https://drive.google.com/embeddedfolderview?id=${id}#grid`
    : `https://drive.google.com/file/d/${id}/preview`;

/** Same-origin stream of a Drive file, for a native `<video>` (see `/api/drive/[id]`). */
export const driveStreamUrl = (id: string) => `/api/drive/${id}`;
