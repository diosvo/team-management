import { and, asc, desc, eq } from 'drizzle-orm';

import { SELECTABLE_DOCUMENT_TYPES } from '@/utils/constants';
import type { DocumentType } from '@/utils/enum';

import db from '@/drizzle';
import {
  type Document,
  DocumentTable,
  type InsertDocument,
} from '@/drizzle/schema/document';

/** Document count in total and per type. */
export type DocumentStatsValues = Record<'total' | DocumentType, number>;

/** Counts the documents per type in one pass. */
export function countDocuments(
  documents: Array<Pick<Document, 'type'>>,
): DocumentStatsValues {
  const stats = Object.fromEntries(
    SELECTABLE_DOCUMENT_TYPES.map((type) => [type, 0]),
  ) as DocumentStatsValues;

  for (const { type } of documents) stats[type]++;
  stats.total = documents.length;

  return stats;
}

export async function selectDocuments(team_id: string) {
  try {
    const documents = await db.query.DocumentTable.findMany({
      where: eq(DocumentTable.team_id, team_id),
      orderBy: [desc(DocumentTable.event_date), asc(DocumentTable.title)],
    });

    return { stats: countDocuments(documents), data: documents };
  } catch {
    return { stats: countDocuments([]), data: [] };
  }
}

export async function insertDocument(document: InsertDocument) {
  return await db.insert(DocumentTable).values(document);
}

/** Matches `document_id` only when it belongs to `team_id`. */
const ownDocument = (team_id: string, document_id: string) =>
  and(
    eq(DocumentTable.document_id, document_id),
    eq(DocumentTable.team_id, team_id),
  );

export async function updateDocument(
  team_id: string,
  document_id: string,
  document: InsertDocument,
) {
  return await db
    .update(DocumentTable)
    .set(document)
    .where(ownDocument(team_id, document_id));
}

export async function deleteDocument(team_id: string, document_id: string) {
  return await db
    .delete(DocumentTable)
    .where(ownDocument(team_id, document_id));
}
