import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTeam,
  getTeams as fetchTeams,
  insertTeam,
  updateTeam,
} from '@/db/team';

import { revalidate } from '@/actions/cache';
import { UpsertTeamSchemaValues } from '@/schemas/team';

import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import { MOCK_AWAY_TEAM } from '@/test/mocks/team';

import { getTeams, removeTeam, upsertTeam } from './team';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/team', () => ({
  getTeams: vi.fn(),
  insertTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    teams: vi.fn(),
  },
}));

const TEAM_INPUT: UpsertTeamSchemaValues = {
  name: MOCK_AWAY_TEAM.name,
  email: MOCK_AWAY_TEAM.email,
  establish_year: MOCK_AWAY_TEAM.establish_year,
  logo_url: MOCK_AWAY_TEAM.logo_url,
};

describe('permissions', () => {
  test('scopes to the teams resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('teams');
  });

  test('getTeams is wrapped with withAuth', () => {
    expect(mockWithAuth).toHaveBeenCalledWith(fetchTeams);
  });

  test('upsertTeam requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeTeam requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('Team Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTeams', () => {
    test('returns teams from fetchTeams', async () => {
      vi.mocked(fetchTeams).mockResolvedValue([MOCK_AWAY_TEAM]);

      const result = await getTeams();

      expect(result).toEqual([MOCK_AWAY_TEAM]);
    });

    test('returns empty array when fetchTeams returns empty array', async () => {
      vi.mocked(fetchTeams).mockResolvedValue([]);

      const result = await getTeams();
      expect(result).toEqual([]);
    });
  });

  describe('upsertTeam', () => {
    test('inserts a new team when no id is provided', async () => {
      const result = await upsertTeam('', TEAM_INPUT);

      expect(insertTeam).toHaveBeenCalledWith(TEAM_INPUT);
      expect(updateTeam).not.toHaveBeenCalled();
      expect(revalidate.teams).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added team successfully',
      });
    });

    test('updates an existing team when an id is provided', async () => {
      const result = await upsertTeam(MOCK_AWAY_TEAM.team_id, TEAM_INPUT);

      expect(updateTeam).toHaveBeenCalledWith(
        MOCK_AWAY_TEAM.team_id,
        TEAM_INPUT,
      );
      expect(insertTeam).not.toHaveBeenCalled();
      expect(revalidate.teams).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated team successfully',
      });
    });

    test('returns an error when the db operation fails', async () => {
      const message = 'Email already exists';
      vi.mocked(insertTeam).mockRejectedValue(new Error(message));
      vi.mocked(getDbErrorMessage).mockReturnValue({ message } as ReturnType<
        typeof getDbErrorMessage
      >);

      const result = await upsertTeam('', TEAM_INPUT);

      expect(revalidate.teams).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, message });
    });
  });

  describe('removeTeam', () => {
    test('deletes a team and revalidates', async () => {
      const result = await removeTeam(MOCK_AWAY_TEAM.team_id);

      expect(deleteTeam).toHaveBeenCalledWith(MOCK_AWAY_TEAM.team_id);
      expect(revalidate.teams).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Deleted team successfully',
      });
    });

    test('', async () => {
      vi.mocked(deleteTeam).mockRejectedValue(new Error('boom'));

      const result = await removeTeam(MOCK_AWAY_TEAM.team_id);

      expect(revalidate.teams).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Something went wrong.',
      });
    });
  });
});
