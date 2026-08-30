import { eq, inArray, ne } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertPlayer, PlayerTable } from '@/drizzle/schema/player';
import { UserTable } from '@/drizzle/schema/user';

import {
  mockInsertFailure,
  mockInsertSuccess,
  mockSelectSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_PLAYER } from '@/test/mocks/user';

import {
  getTeamPlayerIds,
  insertPlayer,
  isJerseyNumberTaken,
  updatePlayer,
} from './player';

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
    select: vi.fn(),
  },
}));

vi.mock('@/drizzle/schema/player', () => ({
  PlayerTable: {
    id: 'player-123',
    jersey_number: 'jersey_number',
  },
}));

vi.mock('@/drizzle/schema/user', () => ({
  UserTable: {
    id: 'id',
    team_id: 'team_id',
  },
}));

const team_id = MOCK_TEAM.team_id;
const { id, jersey_number } = MOCK_PLAYER;

describe('insertPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts player successfully', async () => {
    const mockValues = mockInsertSuccess({ id });

    const result = await insertPlayer(MOCK_PLAYER);

    expect(result).toEqual({ id });
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
    const { mockWhere, mockSet } = mockUpdateSuccess({ id });

    const result = await updatePlayer(updatedPlayer);

    expect(result).toEqual({ id });
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

describe('getTeamPlayerIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns only the ids that are players on the team', async () => {
    const { mockInnerJoin, mockWhereWithGroupBy } = mockSelectSuccess([{ id }]);

    const result = await getTeamPlayerIds(team_id, [id, 'player-elsewhere']);

    expect(result).toEqual([id]);
    // Verify query construction: the team is only reachable through `user`
    expect(mockInnerJoin).toHaveBeenCalledWith(UserTable, {
      field: UserTable.id,
      value: PlayerTable.id,
      type: 'eq',
    });
    expect(eq).toHaveBeenCalledWith(UserTable.team_id, team_id);
    expect(inArray).toHaveBeenCalledWith(PlayerTable.id, [
      id,
      'player-elsewhere',
    ]);
    expect(mockWhereWithGroupBy).toHaveBeenCalledWith([
      { field: UserTable.team_id, value: team_id, type: 'eq' },
      {
        field: PlayerTable.id,
        values: [id, 'player-elsewhere'],
        type: 'in',
      },
    ]);
  });

  test('skips the query entirely when there is nothing to check', async () => {
    const result = await getTeamPlayerIds(team_id, []);

    expect(result).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('isJerseyNumberTaken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reports a clash within the team', async () => {
    mockSelectSuccess([{ id }]);

    const result = await isJerseyNumberTaken(
      team_id,
      jersey_number as number,
      id,
    );

    expect(result).toBe(true);
  });

  test('scopes the lookup to the team and excludes the player being edited', async () => {
    const { mockLeftJoin, mockWhereWithGroupBy, mockLimit } = mockSelectSuccess(
      [],
    );

    const result = await isJerseyNumberTaken(
      team_id,
      jersey_number as number,
      id,
    );

    expect(result).toBe(false);
    // Verify query construction: the team only reachable through `user`
    expect(mockLeftJoin).toHaveBeenCalledWith(UserTable, {
      field: UserTable.id,
      value: PlayerTable.id,
      type: 'eq',
    });
    expect(eq).toHaveBeenCalledWith(UserTable.team_id, team_id);
    expect(eq).toHaveBeenCalledWith(PlayerTable.jersey_number, jersey_number);
    expect(ne).toHaveBeenCalledWith(PlayerTable.id, id);
    expect(mockWhereWithGroupBy).toHaveBeenCalledWith([
      { field: UserTable.team_id, value: team_id, type: 'eq' },
      {
        field: PlayerTable.jersey_number,
        value: jersey_number,
        type: 'eq',
      },
      { field: PlayerTable.id, value: id, type: 'ne' },
    ]);
    expect(mockLimit).toHaveBeenCalledWith(1);
  });
});
