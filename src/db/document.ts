import { asc, desc, eq } from 'drizzle-orm';

import { DocumentType } from '@/utils/enum';

import db from '@/drizzle';
import { DocumentTable, type InsertDocument } from '@/drizzle/schema/document';

const EMPTY_STATS = {
  total: 0,
  albums: 0,
  videos: 0,
  tactics: 0,
  files: 0,
};

export async function selectDocuments(team_id: string) {
  try {
    const documents = await db.query.DocumentTable.findMany({
      where: eq(DocumentTable.team_id, team_id),
      orderBy: [desc(DocumentTable.event_date), asc(DocumentTable.title)],
    });

    const stats = {
      total: documents.length,
      albums: documents.filter((doc) => doc.type === DocumentType.ALBUM).length,
      videos: documents.filter((doc) => doc.type === DocumentType.VIDEO).length,
      tactics: documents.filter((doc) => doc.type === DocumentType.TACTIC)
        .length,
      files: documents.filter((doc) => doc.type === DocumentType.FILE).length,
    };

    return {
      stats,
      data: documents,
    };
  } catch {
    return {
      stats: EMPTY_STATS,
      data: [],
    };
  }
}

export async function insertDocument(document: InsertDocument) {
  return await db.insert(DocumentTable).values(document);
}

export async function updateDocument(
  document_id: string,
  document: InsertDocument,
) {
  return await db
    .update(DocumentTable)
    .set(document)
    .where(eq(DocumentTable.document_id, document_id));
}

export async function deleteDocument(document_id: string) {
  return await db
    .delete(DocumentTable)
    .where(eq(DocumentTable.document_id, document_id));
}
