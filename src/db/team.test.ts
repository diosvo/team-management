import db from '@/drizzle';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertReturningSuccess,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_TEAM } from '@/test/mocks/team';

import { deleteTeam, getTeam, getTeams, insertTeam, updateTeam } from './team';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      TeamTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/drizzle/schema/team', () => ({
  TeamTable: {
    team_id: 'team_id',
    name: 'name',
    is_external: 'is_external',
  },
}));

describe('getTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns external teams ordered by name', async () => {
    vi.mocked(db.query.TeamTable.findMany).mockResolvedValue([MOCK_TEAM]);

    const result = await getTeams();

    expect(result).toEqual([MOCK_TEAM]);
  });

  test('returns an empty array when the query fails', async () => {
    vi.mocked(db.query.TeamTable.findMany).mockRejectedValue(
      new Error('db down'),
    );

    const result = await getTeams();

    expect(result).toEqual([]);
  });
});

describe('getTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns the matching team', async () => {
    vi.mocked(db.query.TeamTable.findFirst).mockResolvedValue(MOCK_TEAM);

    const result = await getTeam(MOCK_TEAM.team_id);

    expect(result).toEqual(MOCK_TEAM);
  });
});

describe('insertTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts the team as a non-default, external team', async () => {
    const { mockValues } = mockInsertReturningSuccess([
      { team_id: MOCK_TEAM.team_id },
    ]);

    const result = await insertTeam({ name: 'New Team' } as never);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Team',
        is_default: false,
        is_external: true,
      }),
    );
    expect(result).toEqual({ team_id: MOCK_TEAM.team_id });
  });
});

describe('updateTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates only an external team', async () => {
    const { mockSet } = mockUpdateSuccess(undefined);

    await updateTeam(MOCK_TEAM.team_id, { name: 'Renamed' });

    expect(mockSet).toHaveBeenCalledWith({ name: 'Renamed' });
  });
});

describe('deleteTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes an external team', async () => {
    const mockWhere = mockDeleteSuccess(undefined);

    await deleteTeam(MOCK_TEAM.team_id);

    expect(mockWhere).toHaveBeenCalled();
  });

  test('propagates a failed delete', async () => {
    mockDeleteFailure('db error');

    await expect(deleteTeam(MOCK_TEAM.team_id)).rejects.toThrow('db error');
  });
});
