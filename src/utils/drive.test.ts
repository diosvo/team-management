import {
  detectDocumentType,
  drivePreviewUrl,
  driveStreamUrl,
  driveThumbnailUrl,
  isDriveUrl,
  isPlayable,
  parseDriveUrl,
} from './drive';
import { DocumentType, DriveKind } from './enum';

const FOLDER_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
const FILE_ID = '1ZyXwVuTsRqPoNmLkJiHgFeDcBa543210';

describe('parseDriveUrl', () => {
  test.each([
    [
      `https://drive.google.com/drive/folders/${FOLDER_ID}`,
      { id: FOLDER_ID, kind: DriveKind.FOLDER },
    ],
    [
      `https://drive.google.com/drive/folders/${FOLDER_ID}?usp=sharing`,
      { id: FOLDER_ID, kind: DriveKind.FOLDER },
    ],
    [
      `https://drive.google.com/drive/u/0/folders/${FOLDER_ID}`,
      { id: FOLDER_ID, kind: DriveKind.FOLDER },
    ],
    [
      `https://drive.google.com/file/d/${FILE_ID}/view?usp=drive_link`,
      { id: FILE_ID, kind: DriveKind.FILE },
    ],
    [
      `https://docs.google.com/spreadsheets/d/${FILE_ID}/edit#gid=0`,
      { id: FILE_ID, kind: DriveKind.FILE },
    ],
    [
      `https://drive.google.com/open?id=${FILE_ID}`,
      { id: FILE_ID, kind: DriveKind.FILE },
    ],
    [
      `https://drive.google.com/uc?export=download&id=${FILE_ID}`,
      { id: FILE_ID, kind: DriveKind.FILE },
    ],
  ])('parses %s', (url, expected) => {
    expect(parseDriveUrl(url)).toEqual(expected);
  });

  test('tolerates surrounding whitespace', () => {
    expect(
      parseDriveUrl(`  https://drive.google.com/file/d/${FILE_ID}  `),
    ).toEqual({
      id: FILE_ID,
      kind: DriveKind.FILE,
    });
  });

  test.each([
    null,
    undefined,
    '',
    'not a url',
    'https://example.com/drive/folders/abc',
    'http://drive.google.com/drive/folders/' + FOLDER_ID, // http, not https
    'https://drive.google.com/drive/my-drive',
    'https://drive.google.com/file/d/short',
  ])('rejects %s', (url) => {
    expect(parseDriveUrl(url)).toBeNull();
    expect(isDriveUrl(url)).toBe(false);
  });
});

describe('detectDocumentType', () => {
  test('folders are albums', () => {
    expect(
      detectDocumentType(`https://drive.google.com/drive/folders/${FOLDER_ID}`),
    ).toBe(DocumentType.ALBUM);
  });

  test.each([
    { type: DocumentType.VIDEO, plays: true },
    { type: DocumentType.TACTIC, plays: true },
    { type: DocumentType.ALBUM, plays: false },
    { type: DocumentType.FILE, plays: false },
  ])('$type plays in the app: $plays', ({ type, plays }) => {
    expect(isPlayable(type)).toBe(plays);
  });

  test('drive files default to videos', () => {
    expect(
      detectDocumentType(`https://drive.google.com/file/d/${FILE_ID}/view`),
    ).toBe(DocumentType.VIDEO);
  });

  test('google docs links are files', () => {
    expect(
      detectDocumentType(`https://docs.google.com/document/d/${FILE_ID}/edit`),
    ).toBe(DocumentType.FILE);
  });
});

describe('drive urls', () => {
  test('builds the public thumbnail url', () => {
    expect(driveThumbnailUrl(FILE_ID)).toBe(
      `https://drive.google.com/thumbnail?id=${FILE_ID}&sz=w400`,
    );
    expect(driveThumbnailUrl(FILE_ID, 800)).toContain('sz=w800');
  });

  test('previews a file in the Drive viewer', () => {
    expect(drivePreviewUrl({ id: FILE_ID, kind: DriveKind.FILE })).toBe(
      `https://drive.google.com/file/d/${FILE_ID}/preview`,
    );
  });

  test('previews a folder as a photo grid', () => {
    expect(drivePreviewUrl({ id: FOLDER_ID, kind: DriveKind.FOLDER })).toBe(
      `https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}#grid`,
    );
  });

  test('streams a file through our route', () => {
    expect(driveStreamUrl(FILE_ID)).toBe(`/api/drive/${FILE_ID}`);
  });
});
