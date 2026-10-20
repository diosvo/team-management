import { and, desc, eq, isNull } from 'drizzle-orm';

import db from '@/drizzle';
import { UserTable } from '@/drizzle/schema/user';
import { UserTeamTable } from '@/drizzle/schema/user-team';

import {
  mockInsertReturningFailure,
  mockInsertReturningSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_USER, MOCK_USER_TEAM } from '@/test/mocks/user';

import {
  getCurrentMembership,
  getMemberships,
  insertMembership,
  transferMembership,
  updateCurrentMembership,
} from './user-team';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      UserTeamTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('@/drizzle/schema/user-team', () => ({
  UserTeamTable: {
    user_team_id: 'user_team_id',
    user_id: 'user_id',
    team_id: 'team_id',
    join_date: 'join_date',
    leave_date: 'leave_date',
  },
}));

vi.mock('@/drizzle/schema/user', () => ({
  UserTable: {
    id: 'id',
    team_id: 'team_id',
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getMemberships', () => {
  test('returns every stint, most recent first', async () => {
    vi.mocked(db.query.UserTeamTable.findMany).mockResolvedValue([
      MOCK_USER_TEAM,
    ]);

    const result = await getMemberships(MOCK_USER.id);

    expect(result).toEqual([MOCK_USER_TEAM]);
    expect(db.query.UserTeamTable.findMany).toHaveBeenCalledWith({
      where: eq(UserTeamTable.user_id, MOCK_USER.id),
      orderBy: desc(UserTeamTable.join_date),
    });
  });

  test('returns empty array when the query fails', async () => {
    vi.mocked(db.query.UserTeamTable.findMany).mockRejectedValue(
      new Error('Database error'),
    );

    expect(await getMemberships(MOCK_USER.id)).toEqual([]);
  });
});

describe('getCurrentMembership', () => {
  test('narrows to the stint without a leave date', async () => {
    vi.mocked(db.query.UserTeamTable.findFirst).mockResolvedValue(
      MOCK_USER_TEAM,
    );

    const result = await getCurrentMembership(MOCK_USER.id);

    expect(result).toEqual(MOCK_USER_TEAM);
    expect(db.query.UserTeamTable.findFirst).toHaveBeenCalledWith({
      where: and(
        eq(UserTeamTable.user_id, MOCK_USER.id),
        isNull(UserTeamTable.leave_date),
      ),
    });
  });

  test('returns null when the query fails', async () => {
    vi.mocked(db.query.UserTeamTable.findFirst).mockRejectedValue(
      new Error('Database error'),
    );

    expect(await getCurrentMembership(MOCK_USER.id)).toBeNull();
  });
});

describe('insertMembership', () => {
  test('opens a stint on the given team', async () => {
    const { mockValues } = mockInsertReturningSuccess([
      { user_team_id: MOCK_USER_TEAM.user_team_id },
    ]);

    const result = await insertMembership(
      MOCK_USER.id,
      MOCK_TEAM.team_id,
      MOCK_USER_TEAM.join_date,
    );

    expect(result).toEqual({ user_team_id: MOCK_USER_TEAM.user_team_id });
    expect(db.insert).toHaveBeenCalledWith(UserTeamTable);
    expect(mockValues).toHaveBeenCalledWith({
      user_id: MOCK_USER.id,
      team_id: MOCK_TEAM.team_id,
      join_date: MOCK_USER_TEAM.join_date,
    });
  });

  test('throws when the insert fails', async () => {
    const message = 'Insert failed';
    mockInsertReturningFailure(message);

    await expect(
      insertMembership(
        MOCK_USER.id,
        MOCK_TEAM.team_id,
        MOCK_USER_TEAM.join_date,
      ),
    ).rejects.toThrow(message);
  });
});

describe('transferMembership', () => {
  const NEW_TEAM = 'team-456';
  const JOIN_DATE = '2026-08-30';

  function mockTransaction() {
    const closeWhere = vi.fn().mockResolvedValue(undefined);
    const closeSet = vi.fn().mockReturnValue({ where: closeWhere });
    const pointerWhere = vi.fn().mockResolvedValue(undefined);
    const pointerSet = vi.fn().mockReturnValue({ where: pointerWhere });

    const update = vi
      .fn()
      .mockReturnValueOnce({ set: closeSet })
      .mockReturnValueOnce({ set: pointerSet });

    const returning = vi
      .fn()
      .mockResolvedValue([{ user_team_id: 'user-team-456' }]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });

    const tx = { update, insert };
    vi.mocked(db.transaction).mockImplementation((callback) =>
      callback(tx as never),
    );

    return { update, insert, values, closeSet, pointerSet, closeWhere };
  }

  test('closes the open stint, opens the new one, and repoints the user', async () => {
    const { update, insert, values, closeSet, pointerSet } = mockTransaction();

    const result = await transferMembership(MOCK_USER.id, NEW_TEAM, JOIN_DATE);

    expect(result).toEqual({ user_team_id: 'user-team-456' });

    // The stint the user is leaving is closed the day the next one starts,
    // so the history has no gap and no overlap.
    expect(update).toHaveBeenNthCalledWith(1, UserTeamTable);
    expect(closeSet).toHaveBeenCalledWith({ leave_date: JOIN_DATE });

    expect(insert).toHaveBeenCalledWith(UserTeamTable);
    expect(values).toHaveBeenCalledWith({
      user_id: MOCK_USER.id,
      team_id: NEW_TEAM,
      join_date: JOIN_DATE,
    });

    // The denormalized pointer moves in the same transaction
    expect(update).toHaveBeenNthCalledWith(2, UserTable);
    expect(pointerSet).toHaveBeenCalledWith({ team_id: NEW_TEAM });
  });

  test('propagates a failure so the transaction rolls back', async () => {
    vi.mocked(db.transaction).mockRejectedValue(new Error('Transfer failed'));

    await expect(
      transferMembership(MOCK_USER.id, NEW_TEAM, JOIN_DATE),
    ).rejects.toThrow('Transfer failed');
  });
});

describe('updateCurrentMembership', () => {
  test('only touches the open stint', async () => {
    const { mockSet } = mockUpdateSuccess({ rowCount: 1 });

    const result = await updateCurrentMembership(MOCK_USER.id, {
      join_date: '2025-01-01',
    });

    expect(result).toEqual({ rowCount: 1 });
    expect(db.update).toHaveBeenCalledWith(UserTeamTable);
    expect(mockSet).toHaveBeenCalledWith({ join_date: '2025-01-01' });
    expect(isNull).toHaveBeenCalledWith(UserTeamTable.leave_date);
  });

  test('throws when the update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateCurrentMembership(MOCK_USER.id, { join_date: '2025-01-01' }),
    ).rejects.toThrow(message);
  });
});
