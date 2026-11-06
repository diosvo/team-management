import { and, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { TestNoteTable } from '@/drizzle/schema';

import {
  deleteTestNote,
  findTypeNote,
  insertTestNote,
  updateTestNote,
} from './test-note';

const values = vi.fn();
const returning = vi.fn();
const where = vi.fn(() => ({ returning }));
const updateWhere = vi.fn();
const set = vi.fn(() => ({ where: updateWhere }));
const findFirst = vi.fn();

vi.mock('@/drizzle', () => ({
  default: {
    insert: vi.fn(() => ({ values })),
    delete: vi.fn(() => ({ where })),
    update: vi.fn(() => ({ set })),
    query: {
      TestNoteTable: {
        // Deferred: the mock factory is hoisted above `findFirst`.
        findFirst: (...args: Array<unknown>) => findFirst(...args),
      },
    },
  },
}));

vi.mock('@/drizzle/schema', () => ({
  TestNoteTable: {
    note_id: 'note_id',
    player_id: 'player_id',
    type_id: 'type_id',
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('insertTestNote inserts the note', async () => {
  const note = { player_id: 'p1', content: 'Good form' };
  values.mockResolvedValue({ rowCount: 1 });

  await expect(insertTestNote(note)).resolves.toEqual({ rowCount: 1 });

  expect(db.insert).toHaveBeenCalledWith(TestNoteTable);
  expect(values).toHaveBeenCalledWith(note);
});

test('deleteTestNote deletes by id and player and returns the player', async () => {
  returning.mockResolvedValue([{ player_id: 'p1' }]);

  await expect(deleteTestNote('n1', 'p1')).resolves.toEqual([
    { player_id: 'p1' },
  ]);

  expect(db.delete).toHaveBeenCalledWith(TestNoteTable);
  expect(where).toHaveBeenCalledWith(
    and(eq(TestNoteTable.note_id, 'n1'), eq(TestNoteTable.player_id, 'p1')),
  );
  expect(returning).toHaveBeenCalledWith({ player_id: 'player_id' });
});

test('findTypeNote looks up the note for a player and test type', async () => {
  findFirst.mockResolvedValue({ note_id: 'n1' });

  await expect(findTypeNote('p1', 't1')).resolves.toEqual({ note_id: 'n1' });

  expect(findFirst).toHaveBeenCalledWith({
    columns: { note_id: true },
    where: and(
      eq(TestNoteTable.player_id, 'p1'),
      eq(TestNoteTable.type_id, 't1'),
    ),
  });
});

test('updateTestNote updates the note scoped to its player', async () => {
  const note = {
    content: 'Edited',
    type_id: null,
    goal: null,
    author_id: 'u1',
  };
  updateWhere.mockResolvedValue({ rowCount: 1 });

  await expect(updateTestNote('n1', 'p1', note)).resolves.toEqual({
    rowCount: 1,
  });

  expect(db.update).toHaveBeenCalledWith(TestNoteTable);
  expect(set).toHaveBeenCalledWith({ ...note, updated_at: expect.any(Date) });
  expect(updateWhere).toHaveBeenCalledWith(
    and(eq(TestNoteTable.note_id, 'n1'), eq(TestNoteTable.player_id, 'p1')),
  );
});
