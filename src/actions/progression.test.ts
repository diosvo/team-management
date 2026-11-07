import { notFound } from 'next/navigation';

import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  isPlayerInTeamScope,
  selectPlayerProgression,
  selectTeamProgression,
} from '@/db/progression';
import {
  deleteTestNote,
  insertTestNote,
  selectTestNote,
  selectTypeNote,
  updateTestNote,
} from '@/db/test-note';
import { mockWithResource, mockWithResourceAction } from '@/test/mocks/auth';
import {
  MOCK_GENERAL_NOTE,
  MOCK_PROGRESSION_TYPE,
  MOCK_TEST_NOTE,
} from '@/test/mocks/progression';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_PLAYER, MOCK_USER } from '@/test/mocks/user';

import {
  getPlayerProgressionById,
  getProgression,
  removeTestNote,
  saveTestNote,
} from './progression';

vi.mock('./auth', () => ({ withResource: mockWithResource }));

vi.mock('@/db/progression', () => ({
  selectTeamProgression: vi.fn(),
  selectPlayerProgression: vi.fn(),
  isPlayerInTeamScope: vi.fn(),
}));

vi.mock('@/db/test-note', () => ({
  insertTestNote: vi.fn(),
  deleteTestNote: vi.fn(),
  selectTestNote: vi.fn(),
  selectTypeNote: vi.fn(),
  updateTestNote: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({ revalidate: { testNotes: vi.fn() } }));

const dbError = () => {
  vi.mocked(getDbErrorMessage).mockReturnValue({
    message: 'DB failed',
    constraint: null,
  });
};

beforeEach(() => {
  vi.mocked(isPlayerInTeamScope).mockResolvedValue(true);
  vi.mocked(selectTestNote).mockResolvedValue({
    note_id: MOCK_TEST_NOTE.note_id,
    player_id: MOCK_PLAYER.id,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('permissions', () => {
  test('scopes to periodic-testing with view/create+edit/delete', () => {
    expect(mockWithResource).toHaveBeenCalledWith('periodic-testing');
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      'view',
      expect.objectContaining({ name: 'getProgression' }),
    );
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'save' }),
    );
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('getProgression', () => {
  test('reads the team progression for a type', async () => {
    const data = { types: [], progression: null };
    vi.mocked(selectTeamProgression).mockResolvedValue(data);

    await expect(getProgression(MOCK_PROGRESSION_TYPE.type_id)).resolves.toBe(
      data,
    );
    expect(selectTeamProgression).toHaveBeenCalledWith(
      MOCK_TEAM.team_id,
      MOCK_PROGRESSION_TYPE.type_id,
    );
  });
});

describe('getPlayerProgressionById', () => {
  test('returns the player progression', async () => {
    const data = {
      player_id: MOCK_PLAYER.id,
      player_name: MOCK_USER.name,
      types: [],
      notes: [],
      test_types: [],
    };
    vi.mocked(selectPlayerProgression).mockResolvedValue(data);

    await expect(getPlayerProgressionById(MOCK_PLAYER.id)).resolves.toBe(data);
  });

  test('calls notFound when the player has no progression', async () => {
    vi.mocked(selectPlayerProgression).mockResolvedValue(null);

    await expect(getPlayerProgressionById(MOCK_PLAYER.id)).rejects.toThrow(
      'NOT_FOUND',
    );
    expect(notFound).toHaveBeenCalled();
  });
});

describe('saveTestNote', () => {
  test('stores a typed note with its goal', async () => {
    const result = await saveTestNote(MOCK_PLAYER.id, {
      type_id: MOCK_PROGRESSION_TYPE.type_id,
      content: MOCK_TEST_NOTE.content,
      goal: '4.2',
    });

    expect(insertTestNote).toHaveBeenCalledWith({
      player_id: MOCK_PLAYER.id,
      author_id: MOCK_USER.id,
      content: MOCK_TEST_NOTE.content,
      type_id: MOCK_PROGRESSION_TYPE.type_id,
      goal: '4.2',
    });
    expect(revalidate.testNotes).toHaveBeenCalledWith(MOCK_PLAYER.id);
    expect(result).toEqual({
      success: true,
      message: 'Note added successfully',
    });
  });

  test('drops the goal on a general note', async () => {
    await saveTestNote(MOCK_PLAYER.id, {
      type_id: '',
      content: MOCK_TEST_NOTE.content,
      goal: '4',
    });

    expect(insertTestNote).toHaveBeenCalledWith(
      expect.objectContaining({ type_id: null, goal: null }),
    );
  });

  test('stores no goal when a typed note leaves it empty', async () => {
    await saveTestNote(MOCK_PLAYER.id, {
      type_id: MOCK_PROGRESSION_TYPE.type_id,
      content: MOCK_TEST_NOTE.content,
      goal: '',
    });

    expect(insertTestNote).toHaveBeenCalledWith(
      expect.objectContaining({
        type_id: MOCK_PROGRESSION_TYPE.type_id,
        goal: null,
      }),
    );
  });

  test('updates the note being edited', async () => {
    const result = await saveTestNote(
      MOCK_PLAYER.id,
      { type_id: '', content: 'Edited', goal: '' },
      MOCK_TEST_NOTE.note_id,
    );

    expect(selectTypeNote).not.toHaveBeenCalled();
    expect(updateTestNote).toHaveBeenCalledWith(
      MOCK_TEST_NOTE.note_id,
      MOCK_PLAYER.id,
      {
        author_id: MOCK_USER.id,
        content: 'Edited',
        type_id: null,
        goal: null,
      },
    );
    expect(insertTestNote).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'Note updated successfully',
    });
  });

  test("updates the player's existing note for the same focus area", async () => {
    vi.mocked(selectTypeNote).mockResolvedValueOnce({
      note_id: MOCK_GENERAL_NOTE.note_id,
    });

    const result = await saveTestNote(MOCK_PLAYER.id, {
      type_id: MOCK_PROGRESSION_TYPE.type_id,
      content: MOCK_TEST_NOTE.content,
      goal: '5',
    });

    expect(selectTypeNote).toHaveBeenCalledWith(
      MOCK_PLAYER.id,
      MOCK_PROGRESSION_TYPE.type_id,
    );
    expect(updateTestNote).toHaveBeenCalledWith(
      MOCK_GENERAL_NOTE.note_id,
      MOCK_PLAYER.id,
      expect.objectContaining({
        type_id: MOCK_PROGRESSION_TYPE.type_id,
        goal: '5',
      }),
    );
    expect(insertTestNote).not.toHaveBeenCalled();
    expect(result.message).toBe('Note updated successfully');
  });

  test('rejects a player outside the team', async () => {
    vi.mocked(isPlayerInTeamScope).mockResolvedValueOnce(false);

    const result = await saveTestNote('p9', {
      type_id: '',
      content: MOCK_TEST_NOTE.content,
      goal: '',
    });

    expect(isPlayerInTeamScope).toHaveBeenCalledWith(MOCK_TEAM.team_id, 'p9');
    expect(insertTestNote).not.toHaveBeenCalled();
    expect(updateTestNote).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, message: 'Note not found' });
  });

  test('returns the DB error', async () => {
    vi.mocked(insertTestNote).mockRejectedValue(new Error('boom'));
    dbError();

    const result = await saveTestNote(MOCK_PLAYER.id, {
      type_id: '',
      content: MOCK_TEST_NOTE.content,
      goal: '',
    });

    expect(revalidate.testNotes).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, message: 'DB failed' });
  });
});

describe('removeTestNote', () => {
  test('deletes and revalidates the player page', async () => {
    vi.mocked(deleteTestNote).mockResolvedValue([
      { player_id: MOCK_PLAYER.id },
    ]);

    const result = await removeTestNote(MOCK_TEST_NOTE.note_id);

    expect(selectTestNote).toHaveBeenCalledWith(MOCK_TEST_NOTE.note_id);
    expect(isPlayerInTeamScope).toHaveBeenCalledWith(
      MOCK_TEAM.team_id,
      MOCK_PLAYER.id,
    );
    expect(deleteTestNote).toHaveBeenCalledWith(
      MOCK_TEST_NOTE.note_id,
      MOCK_PLAYER.id,
    );
    expect(revalidate.testNotes).toHaveBeenCalledWith(MOCK_PLAYER.id);
    expect(result).toEqual({
      success: true,
      message: 'Note removed successfully',
    });
  });

  test.each([
    ['the note does not exist', () => selectTestNote, undefined],
    ['the player is outside the team', () => isPlayerInTeamScope, false],
  ])('rejects when %s', async (_, fn, value) => {
    vi.mocked(fn()).mockResolvedValueOnce(value as never);

    const result = await removeTestNote(MOCK_TEST_NOTE.note_id);

    expect(deleteTestNote).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, message: 'Note not found' });
  });

  test('skips revalidation when nothing was deleted', async () => {
    vi.mocked(deleteTestNote).mockResolvedValue([]);

    await removeTestNote(MOCK_TEST_NOTE.note_id);

    expect(revalidate.testNotes).not.toHaveBeenCalled();
  });

  test('returns the DB error', async () => {
    vi.mocked(deleteTestNote).mockRejectedValue(new Error('boom'));
    dbError();

    await expect(removeTestNote(MOCK_TEST_NOTE.note_id)).resolves.toEqual({
      success: false,
      message: 'DB failed',
    });
  });
});
