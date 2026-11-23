import { DocumentType } from '@/utils/enum';

import type { Document } from '@/drizzle/schema';
import type { UpsertDocumentSchemaValues } from '@/schemas/document';

import { MOCK_TEAM } from './team';

export const MOCK_DRIVE_FOLDER_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
export const MOCK_DRIVE_FILE_ID = '1ZyXwVuTsRqPoNmLkJiHgFeDcBa543210';

export const MOCK_DOCUMENT_INPUT: UpsertDocumentSchemaValues = {
  title: 'Season Opener Photos',
  url: `https://drive.google.com/drive/folders/${MOCK_DRIVE_FOLDER_ID}?usp=sharing`,
  type: DocumentType.ALBUM,
  event_date: '2026-03-01',
  note: null,
};

export const MOCK_DOCUMENT: Document = {
  document_id: 'document-123',
  team_id: MOCK_TEAM.team_id,
  title: MOCK_DOCUMENT_INPUT.title,
  url: MOCK_DOCUMENT_INPUT.url,
  drive_id: MOCK_DRIVE_FOLDER_ID,
  type: MOCK_DOCUMENT_INPUT.type,
  event_date: MOCK_DOCUMENT_INPUT.event_date ?? null,
  note: null,
  created_at: new Date('2026-03-01'),
  updated_at: new Date('2026-03-01'),
};

export const MOCK_VIDEO: Document = {
  ...MOCK_DOCUMENT,
  document_id: 'document-456',
  title: 'Final Quarter Highlights',
  url: `https://drive.google.com/file/d/${MOCK_DRIVE_FILE_ID}/view?usp=sharing`,
  drive_id: MOCK_DRIVE_FILE_ID,
  type: DocumentType.VIDEO,
  event_date: '2025-11-20',
  note: 'Last two minutes',
};

export const MOCK_TACTIC: Document = {
  ...MOCK_VIDEO,
  document_id: 'document-321',
  title: 'Pick and Roll Breakdown',
  type: DocumentType.TACTIC,
  note: null,
};

export const MOCK_PHOTO: Document = {
  ...MOCK_VIDEO,
  document_id: 'document-789',
  title: 'Team Photo',
  type: DocumentType.FILE,
  note: null,
};

export const MOCK_DOCUMENT_STATS = {
  total: 2,
  album: 1,
  video: 1,
  tactic: 0,
  file: 0,
};
