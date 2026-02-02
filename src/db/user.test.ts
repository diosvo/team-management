import { and, eq, ne } from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import { getCacheTag } from '@/actions/cache';
import db from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema/user';

import { UserRole, UserState } from '@/utils/enum';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_TEAM } from '@/test/mocks/team';
import {
  MOCK_PLAYER,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';

import {
  deleteUser,
  fetchActivePlayers,
  getUserById,
  getUsers,
  updateUser,
} from './user';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      UserTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
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

vi.mock('@/drizzle/schema/user', () => ({
  UserTable: {
    team_id: 'team_id',
    id: 'id',
    role: 'role',
    state: 'state',
  },
}));

vi.mock('@/actions/cache', () => ({
  getCacheTag: {
    active_players: vi.fn(() => 'active-players'),
  },
}));

describe('getUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns users when database query succeeds', async () => {
    const mockUsers = [MOCK_USER_WITH_PLAYER, MOCK_USER_WITH_COACH];
    vi.mocked(db.query.UserTable.findMany).mockResolvedValue(mockUsers);

    const result = await getUsers(MOCK_TEAM.team_id);

    expect(result).toEqual(mockUsers);
    // Verify query construction
    expect(db.query.UserTable.findMany).toHaveBeenCalledWith({
      where: and(
        eq(UserTable.team_id, MOCK_TEAM.team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      with: {
        player: true,
        coach: true,
      },
    });
  });

  test('returns empty array when database query fails', async () => {
    const error = new Error('Database error');
    vi.mocked(db.query.UserTable.findMany).mockRejectedValue(error);

    const result = await getUsers(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});

describe('fetchActivePlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns active players when database query succeeds', async () => {
    const mockPlayers = [MOCK_USER_WITH_PLAYER];
    vi.mocked(db.query.UserTable.findMany).mockResolvedValue(mockPlayers);

    const result = await fetchActivePlayers(MOCK_TEAM.team_id);

    expect(result).toEqual(mockPlayers);
    expect(cacheTag).toHaveBeenCalledWith('active-players');
    expect(getCacheTag.active_players).toHaveBeenCalled();
    // Verify query construction
    expect(db.query.UserTable.findMany).toHaveBeenCalledWith({
      where: and(
        eq(UserTable.team_id, MOCK_TEAM.team_id),
        eq(UserTable.role, UserRole.PLAYER),
        eq(UserTable.state, UserState.ACTIVE),
      ),
      with: {
        player: true,
      },
    });
  });

  test('returns empty array when database query fails', async () => {
    const error = new Error('Database error');
    vi.mocked(db.query.UserTable.findMany).mockRejectedValue(error);

    const result = await fetchActivePlayers(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});

describe('getUserById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns user when database query succeeds', async () => {
    vi.mocked(db.query.UserTable.findFirst).mockResolvedValue(
      MOCK_USER_WITH_PLAYER,
    );

    const result = await getUserById(MOCK_PLAYER.id);

    expect(result).toEqual(MOCK_USER_WITH_PLAYER);
    // Verify query construction
    expect(eq).toHaveBeenCalledWith(UserTable.id, MOCK_PLAYER.id);
    expect(db.query.UserTable.findFirst).toHaveBeenCalledWith({
      where: { field: UserTable.id, value: MOCK_PLAYER.id, type: 'eq' },
      with: {
        coach: true,
        player: true,
      },
    });
  });

  test('returns null when database query fails', async () => {
    const error = new Error('Database error');
    vi.mocked(db.query.UserTable.findFirst).mockRejectedValue(error);

    const result = await getUserById(MOCK_PLAYER.id);

    expect(result).toBeNull();
  });
});

describe('updateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUpdateData: Partial<User> = {
    name: 'Updated Name',
    state: UserState.INACTIVE,
  };

  test('updates user successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess({ id: MOCK_PLAYER.id });

    const result = await updateUser(MOCK_PLAYER.id, mockUpdateData);

    expect(result).toEqual({ id: MOCK_PLAYER.id });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(UserTable);
    expect(mockSet).toHaveBeenCalledWith(mockUpdateData);
    expect(eq).toHaveBeenCalledWith(UserTable.id, MOCK_PLAYER.id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: UserTable.id,
      value: MOCK_PLAYER.id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(updateUser(MOCK_PLAYER.id, mockUpdateData)).rejects.toThrow(
      message,
    );
  });
});

describe('deleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes user successfully', async () => {
    const mockWhere = mockDeleteSuccess({ id: MOCK_PLAYER.id });

    const result = await deleteUser(MOCK_PLAYER.id);

    expect(result).toEqual({ id: MOCK_PLAYER.id });
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(UserTable);
    expect(eq).toHaveBeenCalledWith(UserTable.id, MOCK_PLAYER.id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: UserTable.id,
      value: MOCK_PLAYER.id,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(deleteUser(MOCK_PLAYER.id)).rejects.toThrow(message);
  });
});
