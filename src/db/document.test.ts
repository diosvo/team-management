import { and, asc, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { DocumentTable } from '@/drizzle/schema/document';
import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import {
  MOCK_DOCUMENT,
  MOCK_PHOTO,
  MOCK_TACTIC,
  MOCK_VIDEO,
} from '@/test/mocks/document';
import { MOCK_TEAM } from '@/test/mocks/team';

import {
  deleteDocument,
  insertDocument,
  selectDocuments,
  updateDocument,
} from './document';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      DocumentTable: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

vi.mock('@/drizzle/schema/document', () => ({
  DocumentTable: {
    document_id: 'document_id',
    team_id: 'team_id',
    title: 'title',
    event_date: 'event_date',
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('selectDocuments', () => {
  test('returns the team documents with per-type stats', async () => {
    vi.mocked(db.query.DocumentTable.findMany).mockResolvedValue([
      MOCK_DOCUMENT,
      MOCK_VIDEO,
      MOCK_TACTIC,
      MOCK_PHOTO,
      { ...MOCK_PHOTO, document_id: 'undated', event_date: null },
    ]);

    const result = await selectDocuments(MOCK_TEAM.team_id);

    expect(result.stats).toEqual({
      total: 5,
      album: 1,
      video: 1,
      tactic: 1,
      file: 2,
    });
    expect(result.data).toHaveLength(5);
    expect(eq).toHaveBeenCalledWith(DocumentTable.team_id, MOCK_TEAM.team_id);
    expect(db.query.DocumentTable.findMany).toHaveBeenCalledWith({
      where: expect.anything(),
      orderBy: [desc(DocumentTable.event_date), asc(DocumentTable.title)],
    });
  });

  test('returns empty data and zero stats when the query fails', async () => {
    vi.mocked(db.query.DocumentTable.findMany).mockRejectedValue(
      new Error('Database error'),
    );

    expect(await selectDocuments(MOCK_TEAM.team_id)).toEqual({
      stats: { total: 0, album: 0, video: 0, tactic: 0, file: 0 },
      data: [],
    });
  });
});

describe('insertDocument', () => {
  test('inserts the document', async () => {
    const mockValues = mockInsertSuccess({
      document_id: MOCK_DOCUMENT.document_id,
    });

    const result = await insertDocument(MOCK_DOCUMENT);

    expect(result).toEqual({ document_id: MOCK_DOCUMENT.document_id });
    expect(db.insert).toHaveBeenCalledWith(DocumentTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_DOCUMENT);
  });

  test('throws when the insert fails', async () => {
    mockInsertFailure('Insert failed');

    await expect(insertDocument(MOCK_DOCUMENT)).rejects.toThrow(
      'Insert failed',
    );
  });
});

describe('updateDocument', () => {
  test("updates the document by id, within the user's team", async () => {
    const { mockSet, mockWhere } = mockUpdateSuccess({
      document_id: MOCK_DOCUMENT.document_id,
    });

    const result = await updateDocument(
      MOCK_TEAM.team_id,
      MOCK_DOCUMENT.document_id,
      MOCK_DOCUMENT,
    );

    expect(result).toEqual({ document_id: MOCK_DOCUMENT.document_id });
    expect(db.update).toHaveBeenCalledWith(DocumentTable);
    expect(mockSet).toHaveBeenCalledWith(MOCK_DOCUMENT);
    expect(mockWhere).toHaveBeenCalledWith(
      and(
        eq(DocumentTable.document_id, MOCK_DOCUMENT.document_id),
        eq(DocumentTable.team_id, MOCK_TEAM.team_id),
      ),
    );
  });

  test('throws when the update fails', async () => {
    mockUpdateFailure('Update failed');

    await expect(
      updateDocument(
        MOCK_TEAM.team_id,
        MOCK_DOCUMENT.document_id,
        MOCK_DOCUMENT,
      ),
    ).rejects.toThrow('Update failed');
  });
});

describe('deleteDocument', () => {
  test("deletes the document by id, within the user's team", async () => {
    const mockWhere = mockDeleteSuccess({
      document_id: MOCK_DOCUMENT.document_id,
    });

    const result = await deleteDocument(
      MOCK_TEAM.team_id,
      MOCK_DOCUMENT.document_id,
    );

    expect(result).toEqual({ document_id: MOCK_DOCUMENT.document_id });
    expect(db.delete).toHaveBeenCalledWith(DocumentTable);
    expect(mockWhere).toHaveBeenCalledWith(
      and(
        eq(DocumentTable.document_id, MOCK_DOCUMENT.document_id),
        eq(DocumentTable.team_id, MOCK_TEAM.team_id),
      ),
    );
  });

  test('throws when the delete fails', async () => {
    mockDeleteFailure('Delete failed');

    await expect(
      deleteDocument(MOCK_TEAM.team_id, MOCK_DOCUMENT.document_id),
    ).rejects.toThrow('Delete failed');
  });
});
