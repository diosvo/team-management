import { and, eq, isNull, ne } from 'drizzle-orm';

import db from '@/drizzle';
import { CoachTable } from '@/drizzle/schema/coach';
import { PlayerTable } from '@/drizzle/schema/player';
import { type InsertUser, type User, UserTable } from '@/drizzle/schema/user';
import { UserTeamTable } from '@/drizzle/schema/user-team';

import { UserRole, UserState } from '@/utils/enum';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockSelectFailure,
  mockSelectSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_TEAM } from '@/test/mocks/team';
import {
  MOCK_COACH,
  MOCK_PLAYER,
  MOCK_USER,
  MOCK_USER_TEAM,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';

import {
  deleteUser,
  fetchActivePlayers,
  getRosterUsers,
  getTeamHeadCoach,
  getUserById,
  getUsers,
  updateUser,
  updateUserTeamInfo,
} from './user';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      UserTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
    transaction: vi.fn(),
  },
}));

vi.mock('@/drizzle/schema/user', () => ({
  UserTable: {
    team_id: 'team_id',
    id: 'id',
    name: 'name',
    role: 'role',
    state: 'state',
  },
}));

vi.mock('@/drizzle/schema/coach', () => ({
  CoachTable: {
    id: 'coach_id',
  },
}));

vi.mock('@/drizzle/schema/user-team', () => ({
  UserTeamTable: {
    user_id: 'user_id',
    leave_date: 'leave_date',
  },
}));

vi.mock('@/drizzle/schema/player', () => ({
  PlayerTable: {
    id: 'player_id',
  },
}));

describe('getTeamHeadCoach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns first coach when database query succeeds', async () => {
    const mockCoach = [{ id: MOCK_USER.id, name: MOCK_USER.name }];
    const { mockFrom, mockLeftJoin, mockWhereWithGroupBy } =
      mockSelectSuccess(mockCoach);

    const result = await getTeamHeadCoach(MOCK_TEAM.team_id);

    expect(result).toEqual(mockCoach[0]);
    // Verify query construction
    expect(db.select).toHaveBeenCalledWith({
      id: UserTable.id,
      name: UserTable.name,
    });
    expect(mockFrom).toHaveBeenCalledWith(UserTable);
    expect(mockLeftJoin).toHaveBeenCalledWith(
      CoachTable,
      eq(CoachTable.id, UserTable.id),
    );
    expect(mockWhereWithGroupBy).toHaveBeenCalledWith(
      and(
        eq(UserTable.team_id, MOCK_TEAM.team_id),
        eq(UserTable.role, UserRole.COACH),
      ),
    );
  });

  test('returns null when query succeeds but no coach exists', async () => {
    mockSelectSuccess([]);

    const result = await getTeamHeadCoach(MOCK_TEAM.team_id);

    expect(result).toBeNull();
  });

  test('returns null when database query fails', async () => {
    mockSelectFailure('Database error');

    const result = await getTeamHeadCoach(MOCK_TEAM.team_id);

    expect(result).toBeNull();
  });
});

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

describe('getRosterUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns roster users when database query succeeds', async () => {
    const mockUsers = [MOCK_USER_WITH_PLAYER, MOCK_USER_WITH_COACH];
    vi.mocked(db.query.UserTable.findMany).mockResolvedValue(mockUsers);

    const result = await getRosterUsers(MOCK_TEAM.team_id);

    expect(result).toEqual(mockUsers);
    // Verify query construction
    expect(db.query.UserTable.findMany).toHaveBeenCalledWith({
      columns: {
        id: true,
        name: true,
        email: true,
        state: true,
        role: true,
        emailVerified: true,
      },
      where: and(
        eq(UserTable.team_id, MOCK_TEAM.team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      with: {
        player: {
          columns: {
            jersey_number: true,
            position: true,
          },
        },
        coach: {
          columns: {
            position: true,
          },
        },
      },
    });
  });

  test('returns empty array when database query fails', async () => {
    const error = new Error('Database error');
    vi.mocked(db.query.UserTable.findMany).mockRejectedValue(error);

    const result = await getRosterUsers(MOCK_TEAM.team_id);

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

  test('flattens the open membership onto the user', async () => {
    vi.mocked(db.query.UserTable.findFirst).mockResolvedValue({
      ...MOCK_USER_WITH_PLAYER,
      memberships: [MOCK_USER_TEAM],
      // The `with` clause widens the row; the mock's type is the bare user.
    } as never);

    const result = await getUserById(MOCK_PLAYER.id);

    // `join_date` / `leave_date` read the same as before the move to `user_team`
    expect(result).toEqual(MOCK_USER_WITH_PLAYER);
    // Verify query construction
    expect(eq).toHaveBeenCalledWith(UserTable.id, MOCK_PLAYER.id);
    expect(db.query.UserTable.findFirst).toHaveBeenCalledWith({
      where: { field: UserTable.id, value: MOCK_PLAYER.id, type: 'eq' },
      with: {
        coach: true,
        player: true,
        memberships: {
          where: isNull(UserTeamTable.leave_date),
          limit: 1,
        },
      },
    });
  });

  test('reports null dates when the user has no open membership', async () => {
    vi.mocked(db.query.UserTable.findFirst).mockResolvedValue({
      ...MOCK_USER_WITH_PLAYER,
      memberships: [],
    } as never);

    const result = await getUserById(MOCK_PLAYER.id);

    expect(result).toMatchObject({ join_date: null, leave_date: null });
  });

  test('returns null when the user does not exist', async () => {
    vi.mocked(db.query.UserTable.findFirst).mockResolvedValue(undefined);

    expect(await getUserById(MOCK_PLAYER.id)).toBeNull();
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

describe('updateUserTeamInfo', () => {
  // Every write goes through `tx`, so the transaction rolls them back together
  function mockTransaction() {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where: updateWhere });
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const tx = {
      insert: vi.fn().mockReturnValue({ values }),
      update: vi.fn().mockReturnValue({ set }),
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
    };

    vi.mocked(db.transaction).mockImplementation(
      async (callback) => await callback(tx as never),
    );

    return { tx, values, onConflictDoUpdate, set, deleteWhere };
  }

  const user: Partial<InsertUser> = { role: UserRole.COACH };
  const coach = { position: MOCK_COACH.position };
  const player = { jersey_number: MOCK_PLAYER.jersey_number };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('upserts the new role, updates the user and removes the previous role', async () => {
    const { tx, values, onConflictDoUpdate, set, deleteWhere } =
      mockTransaction();

    await updateUserTeamInfo(MOCK_USER.id, {
      user,
      coach,
      remove: { player: true, coach: false },
    });

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledWith(CoachTable);
    expect(values).toHaveBeenCalledWith({ id: MOCK_USER.id, ...coach });
    expect(onConflictDoUpdate).toHaveBeenCalledWith({
      target: CoachTable.id,
      set: { id: MOCK_USER.id, ...coach },
    });
    expect(tx.update).toHaveBeenCalledWith(UserTable);
    expect(set).toHaveBeenCalledWith(user);
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.delete).toHaveBeenCalledWith(PlayerTable);
    expect(deleteWhere).toHaveBeenCalledWith({
      field: PlayerTable.id,
      value: MOCK_USER.id,
      type: 'eq',
    });
    // Nothing escapes the transaction
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  test('removes the coach row when switching away from coach', async () => {
    const { tx, deleteWhere } = mockTransaction();

    await updateUserTeamInfo(MOCK_USER.id, {
      user: { role: UserRole.PLAYER },
      player,
      remove: { player: false, coach: true },
    });

    expect(tx.delete).toHaveBeenCalledWith(CoachTable);
    expect(deleteWhere).toHaveBeenCalledWith({
      field: CoachTable.id,
      value: MOCK_USER.id,
      type: 'eq',
    });
  });

  test('only upserts and updates when the role is unchanged', async () => {
    const { tx } = mockTransaction();

    await updateUserTeamInfo(MOCK_USER.id, {
      user: { role: UserRole.PLAYER },
      player,
      remove: { player: false, coach: false },
    });

    expect(tx.insert).toHaveBeenCalledWith(PlayerTable);
    expect(tx.update).toHaveBeenCalledWith(UserTable);
    expect(tx.update).not.toHaveBeenCalledWith(UserTeamTable);
    expect(tx.delete).not.toHaveBeenCalled();
  });

  test('corrects the open membership stint inside the transaction', async () => {
    const { tx, set } = mockTransaction();
    const membership = { join_date: MOCK_USER_TEAM.join_date };

    await updateUserTeamInfo(MOCK_USER.id, {
      user: { role: UserRole.PLAYER },
      membership,
      player,
      remove: { player: false, coach: false },
    });

    expect(tx.update).toHaveBeenCalledWith(UserTeamTable);
    expect(set).toHaveBeenCalledWith(membership);
    expect(isNull).toHaveBeenCalledWith(UserTeamTable.leave_date);
    expect(db.update).not.toHaveBeenCalled();
  });

  test('rejects so every write rolls back when a step fails', async () => {
    const { deleteWhere } = mockTransaction();
    deleteWhere.mockRejectedValue(new Error('Delete failed'));

    await expect(
      updateUserTeamInfo(MOCK_USER.id, {
        user,
        coach,
        remove: { player: true, coach: false },
      }),
    ).rejects.toThrow('Delete failed');
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
