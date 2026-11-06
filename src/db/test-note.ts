import { and, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { type InsertTestNote, TestNoteTable } from '@/drizzle/schema';

export async function insertTestNote(note: InsertTestNote) {
  return await db.insert(TestNoteTable).values(note);
}

/** The note a player already has for a test type: one per focus area. */
export async function findTypeNote(player_id: string, type_id: string) {
  return await db.query.TestNoteTable.findFirst({
    columns: { note_id: true },
    where: and(
      eq(TestNoteTable.player_id, player_id),
      eq(TestNoteTable.type_id, type_id),
    ),
  });
}

/** Scoped by player so a note id from another player cannot be edited. */
export async function updateTestNote(
  note_id: string,
  player_id: string,
  note: Pick<InsertTestNote, 'content' | 'type_id' | 'goal' | 'author_id'>,
) {
  return await db
    .update(TestNoteTable)
    .set({ ...note, updated_at: new Date() })
    .where(
      and(
        eq(TestNoteTable.note_id, note_id),
        eq(TestNoteTable.player_id, player_id),
      ),
    );
}

export async function findTestNote(note_id: string) {
  return await db.query.TestNoteTable.findFirst({
    columns: { note_id: true, player_id: true },
    where: eq(TestNoteTable.note_id, note_id),
  });
}

export async function deleteTestNote(note_id: string, player_id: string) {
  return await db
    .delete(TestNoteTable)
    .where(
      and(
        eq(TestNoteTable.note_id, note_id),
        eq(TestNoteTable.player_id, player_id),
      ),
    )
    .returning({ player_id: TestNoteTable.player_id });
}
