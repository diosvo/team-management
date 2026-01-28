import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertPlayer, PlayerTable } from '@/drizzle/schema/player';

import {
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_PLAYER } from '@/test/mocks/user';

import { insertPlayer, updatePlayer } from './player';

vi.mock('@/drizzle', () => ({
  default: {
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/drizzle/schema/player', () => ({
  PlayerTable: {
    id: 'player-123',
  },
}));

describe('insertPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts player successfully', async () => {
    const mockValues = mockInsertSuccess({ id: MOCK_PLAYER.id });

    const result = await insertPlayer(MOCK_PLAYER);

    expect(result).toEqual({ id: MOCK_PLAYER.id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(PlayerTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_PLAYER);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(insertPlayer(MOCK_PLAYER)).rejects.toThrow(message);
  });
});

describe('updatePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates player successfully', async () => {
    const updatedPlayer: InsertPlayer = {
      ...MOCK_PLAYER,
      jersey_number: 99,
    };
    const { mockWhere, mockSet } = mockUpdateSuccess({ id: MOCK_PLAYER.id });

    const result = await updatePlayer(updatedPlayer);

    expect(result).toEqual({ id: MOCK_PLAYER.id });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(PlayerTable);
    expect(mockSet).toHaveBeenCalledWith(updatedPlayer);
    expect(eq).toHaveBeenCalledWith(PlayerTable.id, updatedPlayer.id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: PlayerTable.id,
      value: updatedPlayer.id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(updatePlayer(MOCK_PLAYER)).rejects.toThrow(message);
  });
});
