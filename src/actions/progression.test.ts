import { notFound } from 'next/navigation';

import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  getPlayerProgression,
  getTeamProgression,
  isPlayerInTeamScope,
} from '@/db/progression';
import {
  deleteTestNote,
  findTestNote,
  findTypeNote,
  insertTestNote,
  updateTestNote,
} from '@/db/test-note';

import { mockWithResource, mockWithResourceAction } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_USER } from '@/test/mocks/user';

import {
  getPlayerProgressionById,
  getProgression,
  removeTestNote,
  saveTestNote,
} from './progression';

vi.mock('./auth', () => ({ withResource: mockWithResource }));

vi.mock('@/db/progression', () => ({
  getTeamProgression: vi.fn(),
  getPlayerProgression: vi.fn(),
  isPlayerInTeamScope: vi.fn(),
}));

vi.mock('@/db/test-note', () => ({
  insertTestNote: vi.fn(),
  deleteTestNote: vi.fn(),
  findTestNote: vi.fn(),
  findTypeNote: vi.fn(),
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
  vi.mocked(findTestNote).mockResolvedValue({ note_id: 'n1', player_id: 'p1' });
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
    vi.mocked(getTeamProgression).mockResolvedValue(data);

    await expect(getProgression('type-1')).resolves.toBe(data);
    expect(getTeamProgression).toHaveBeenCalledWith(
      MOCK_TEAM.team_id,
      'type-1',
    );
  });
});

describe('getPlayerProgressionById', () => {
  test('returns the player progression', async () => {
    const data = {
      player_id: 'p1',
      player_name: 'An',
      types: [],
      notes: [],
      test_types: [],
    };
    vi.mocked(getPlayerProgression).mockResolvedValue(data);

    await expect(getPlayerProgressionById('p1')).resolves.toBe(data);
  });

  test('calls notFound when the player has no progression', async () => {
    vi.mocked(getPlayerProgression).mockResolvedValue(null);

    await expect(getPlayerProgressionById('p1')).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});

describe('saveTestNote', () => {
  test('stores a typed note with its goal', async () => {
    const result = await saveTestNote('p1', {
      type_id: 'type-1',
      content: 'Faster',
      goal: '4.2',
    });

    expect(insertTestNote).toHaveBeenCalledWith({
      player_id: 'p1',
      author_id: MOCK_USER.id,
      content: 'Faster',
      type_id: 'type-1',
      goal: '4.2',
    });
    expect(revalidate.testNotes).toHaveBeenCalledWith('p1');
    expect(result).toEqual({
      success: true,
      message: 'Note added successfully',
    });
  });

  test('drops the goal on a general note', async () => {
    await saveTestNote('p1', { type_id: '', content: 'Good', goal: '4' });

    expect(insertTestNote).toHaveBeenCalledWith(
      expect.objectContaining({ type_id: null, goal: null }),
    );
  });

  test('stores no goal when a typed note leaves it empty', async () => {
    await saveTestNote('p1', { type_id: 't', content: 'Good', goal: '' });

    expect(insertTestNote).toHaveBeenCalledWith(
      expect.objectContaining({ type_id: 't', goal: null }),
    );
  });

  test('updates the note being edited', async () => {
    const result = await saveTestNote(
      'p1',
      { type_id: '', content: 'Edited', goal: '' },
      'note-9',
    );

    expect(findTypeNote).not.toHaveBeenCalled();
    expect(updateTestNote).toHaveBeenCalledWith('note-9', 'p1', {
      author_id: MOCK_USER.id,
      content: 'Edited',
      type_id: null,
      goal: null,
    });
    expect(insertTestNote).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'Note updated successfully',
    });
  });

  test("updates the player's existing note for the same focus area", async () => {
    vi.mocked(findTypeNote).mockResolvedValueOnce({ note_id: 'note-3' });

    const result = await saveTestNote('p1', {
      type_id: 'type-1',
      content: 'Again',
      goal: '5',
    });

    expect(findTypeNote).toHaveBeenCalledWith('p1', 'type-1');
    expect(updateTestNote).toHaveBeenCalledWith(
      'note-3',
      'p1',
      expect.objectContaining({ type_id: 'type-1', goal: '5' }),
    );
    expect(insertTestNote).not.toHaveBeenCalled();
    expect(result.message).toBe('Note updated successfully');
  });

  test('rejects a player outside the team', async () => {
    vi.mocked(isPlayerInTeamScope).mockResolvedValueOnce(false);

    const result = await saveTestNote('p9', {
      type_id: '',
      content: 'Good',
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

    const result = await saveTestNote('p1', {
      type_id: '',
      content: 'Good',
      goal: '',
    });

    expect(revalidate.testNotes).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, message: 'DB failed' });
  });
});

describe('removeTestNote', () => {
  test('deletes and revalidates the player page', async () => {
    vi.mocked(deleteTestNote).mockResolvedValue([{ player_id: 'p1' }]);

    const result = await removeTestNote('n1');

    expect(findTestNote).toHaveBeenCalledWith('n1');
    expect(isPlayerInTeamScope).toHaveBeenCalledWith(MOCK_TEAM.team_id, 'p1');
    expect(deleteTestNote).toHaveBeenCalledWith('n1', 'p1');
    expect(revalidate.testNotes).toHaveBeenCalledWith('p1');
    expect(result).toEqual({
      success: true,
      message: 'Note removed successfully',
    });
  });

  test.each([
    ['the note does not exist', () => findTestNote, undefined],
    ['the player is outside the team', () => isPlayerInTeamScope, false],
  ])('rejects when %s', async (_, fn, value) => {
    vi.mocked(fn()).mockResolvedValueOnce(value as never);

    const result = await removeTestNote('n1');

    expect(deleteTestNote).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, message: 'Note not found' });
  });

  test('skips revalidation when nothing was deleted', async () => {
    vi.mocked(deleteTestNote).mockResolvedValue([]);

    await removeTestNote('n1');

    expect(revalidate.testNotes).not.toHaveBeenCalled();
  });

  test('returns the DB error', async () => {
    vi.mocked(deleteTestNote).mockRejectedValue(new Error('boom'));
    dbError();

    await expect(removeTestNote('n1')).resolves.toEqual({
      success: false,
      message: 'DB failed',
    });
  });
});
