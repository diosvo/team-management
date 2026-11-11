import { and, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { TestNoteTable } from '@/drizzle/schema';
import {
  MOCK_PROGRESSION_TYPE,
  MOCK_TEST_NOTE,
} from '@/test/mocks/progression';
import { MOCK_PLAYER } from '@/test/mocks/user';

import {
  deleteTestNote,
  insertTestNote,
  selectTestNote,
  selectTypeNote,
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
  const note = { player_id: MOCK_PLAYER.id, content: MOCK_TEST_NOTE.content };
  values.mockResolvedValue({ rowCount: 1 });

  await expect(insertTestNote(note)).resolves.toEqual({ rowCount: 1 });

  expect(db.insert).toHaveBeenCalledWith(TestNoteTable);
  expect(values).toHaveBeenCalledWith(note);
});

test('deleteTestNote deletes by id and player and returns the player', async () => {
  returning.mockResolvedValue([{ player_id: MOCK_PLAYER.id }]);

  await expect(
    deleteTestNote(MOCK_TEST_NOTE.note_id, MOCK_PLAYER.id),
  ).resolves.toEqual([{ player_id: MOCK_PLAYER.id }]);

  expect(db.delete).toHaveBeenCalledWith(TestNoteTable);
  expect(where).toHaveBeenCalledWith(
    and(
      eq(TestNoteTable.note_id, MOCK_TEST_NOTE.note_id),
      eq(TestNoteTable.player_id, MOCK_PLAYER.id),
    ),
  );
  expect(returning).toHaveBeenCalledWith({ player_id: 'player_id' });
});

test('selectTypeNote looks up the note for a player and test type', async () => {
  findFirst.mockResolvedValue({ note_id: MOCK_TEST_NOTE.note_id });

  await expect(
    selectTypeNote(MOCK_PLAYER.id, MOCK_PROGRESSION_TYPE.type_id),
  ).resolves.toEqual({ note_id: MOCK_TEST_NOTE.note_id });

  expect(findFirst).toHaveBeenCalledWith({
    columns: { note_id: true },
    where: and(
      eq(TestNoteTable.player_id, MOCK_PLAYER.id),
      eq(TestNoteTable.type_id, MOCK_PROGRESSION_TYPE.type_id),
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

  await expect(
    updateTestNote(MOCK_TEST_NOTE.note_id, MOCK_PLAYER.id, note),
  ).resolves.toEqual({
    rowCount: 1,
  });

  expect(db.update).toHaveBeenCalledWith(TestNoteTable);
  expect(set).toHaveBeenCalledWith({ ...note, updated_at: expect.any(Date) });
  expect(updateWhere).toHaveBeenCalledWith(
    and(
      eq(TestNoteTable.note_id, MOCK_TEST_NOTE.note_id),
      eq(TestNoteTable.player_id, MOCK_PLAYER.id),
    ),
  );
});

test('selectTestNote looks up a note with its player', async () => {
  findFirst.mockResolvedValue({
    note_id: MOCK_TEST_NOTE.note_id,
    player_id: MOCK_PLAYER.id,
  });

  await expect(selectTestNote(MOCK_TEST_NOTE.note_id)).resolves.toEqual({
    note_id: MOCK_TEST_NOTE.note_id,
    player_id: MOCK_PLAYER.id,
  });
  expect(findFirst).toHaveBeenCalledWith({
    columns: { note_id: true, player_id: true },
    where: eq(TestNoteTable.note_id, MOCK_TEST_NOTE.note_id),
  });
});
