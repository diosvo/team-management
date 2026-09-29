import { listDriveFolder } from '@/lib/drive';

import { revalidate } from '@/actions/cache';
import {
  deleteDocument,
  insertDocument,
  selectDocuments,
  updateDocument,
} from '@/db/document';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import {
  MOCK_DOCUMENT,
  MOCK_DOCUMENT_INPUT,
  MOCK_DOCUMENT_STATS,
  MOCK_DRIVE_FOLDER_ID,
} from '@/test/mocks/document';
import { MOCK_USER } from '@/test/mocks/user';

import {
  getAlbumItems,
  getDocuments,
  removeDocument,
  upsertDocument,
} from './document';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/document', () => ({
  selectDocuments: vi.fn(),
  insertDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

vi.mock('@/lib/drive', () => ({
  listDriveFolder: vi.fn(),
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    documents: vi.fn(),
  },
}));

describe('permissions', () => {
  test('scopes to the documents resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('documents');
  });

  test('upsertDocument requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeDocument requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('Document Actions', () => {
  // The Drive id is parsed from the link and the team comes from the session.
  const saved = {
    ...MOCK_DOCUMENT_INPUT,
    drive_id: MOCK_DRIVE_FOLDER_ID,
    team_id: MOCK_USER.team_id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDocuments', () => {
    test("reads the signed-in user's team documents", async () => {
      const value = { stats: MOCK_DOCUMENT_STATS, data: [MOCK_DOCUMENT] };
      vi.mocked(selectDocuments).mockResolvedValue(value);

      expect(await getDocuments()).toEqual(value);
      expect(selectDocuments).toHaveBeenCalledWith(MOCK_USER.team_id);
    });
  });

  describe('getAlbumItems', () => {
    test('lists the folder through the Drive API', async () => {
      const items = [
        { id: 'a', name: 'IMG.MOV', kind: 'video' as const, thumbnail: null },
      ];
      vi.mocked(listDriveFolder).mockResolvedValue(items);

      expect(await getAlbumItems(MOCK_DRIVE_FOLDER_ID)).toEqual(items);
      expect(listDriveFolder).toHaveBeenCalledWith(MOCK_DRIVE_FOLDER_ID);
    });

    test('never queries Drive with a malformed id', async () => {
      expect(await getAlbumItems("x' or name contains '")).toBeNull();
      expect(listDriveFolder).not.toHaveBeenCalled();
    });
  });

  describe('upsertDocument', () => {
    test('inserts a new document when the id is empty', async () => {
      const result = await upsertDocument('', MOCK_DOCUMENT_INPUT);

      expect(insertDocument).toHaveBeenCalledWith(saved);
      expect(updateDocument).not.toHaveBeenCalled();
      expect(revalidate.documents).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added document successfully',
      });
    });

    test('updates an existing document', async () => {
      const result = await upsertDocument(
        MOCK_DOCUMENT.document_id,
        MOCK_DOCUMENT_INPUT,
      );

      expect(updateDocument).toHaveBeenCalledWith(
        MOCK_DOCUMENT.document_id,
        saved,
      );
      expect(insertDocument).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated document successfully',
      });
    });

    test('rejects a link that is not on Google Drive', async () => {
      const result = await upsertDocument('', {
        ...MOCK_DOCUMENT_INPUT,
        url: 'https://example.com/album',
      });

      expect(insertDocument).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Must be a Google Drive folder or file link.',
      });
    });

    test('explains a duplicate Drive link', async () => {
      vi.mocked(insertDocument).mockRejectedValue(new Error('duplicate'));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Unique constraint violation',
        constraint: 'team_document_drive_id',
      });

      const result = await upsertDocument('', MOCK_DOCUMENT_INPUT);

      expect(revalidate.documents).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'This Drive link is already in the list.',
      });
    });

    test('returns other database errors as is', async () => {
      vi.mocked(updateDocument).mockRejectedValue(new Error('boom'));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Database error',
        constraint: null,
      });

      const result = await upsertDocument(
        MOCK_DOCUMENT.document_id,
        MOCK_DOCUMENT_INPUT,
      );

      expect(result).toEqual({ success: false, message: 'Database error' });
    });
  });

  describe('removeDocument', () => {
    test('deletes the document and revalidates', async () => {
      const result = await removeDocument(MOCK_DOCUMENT.document_id);

      expect(deleteDocument).toHaveBeenCalledWith(MOCK_DOCUMENT.document_id);
      expect(revalidate.documents).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Document deleted successfully',
      });
    });

    test('returns an error when the delete fails', async () => {
      vi.mocked(deleteDocument).mockRejectedValue(new Error('nope'));

      const result = await removeDocument(MOCK_DOCUMENT.document_id);

      expect(revalidate.documents).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Failed to delete document',
      });
    });
  });
});
