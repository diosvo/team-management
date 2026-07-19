import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTeam,
  getTeams as fetchTeams,
  insertTeam,
  updateTeam,
} from '@/db/team';

import { deleteFile, uploadFile } from '@/lib/blob';

import { revalidate } from '@/actions/cache';
import { UpsertTeamSchemaValues } from '@/schemas/team';

import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import { MOCK_AWAY_TEAM } from '@/test/mocks/team';

import { getTeams, removeTeam, uploadLogo, upsertTeam } from './team';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/team', () => ({
  getTeam: vi.fn(),
  getTeams: vi.fn(),
  insertTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
}));

vi.mock('@/lib/blob', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
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
      vi.mocked(insertTeam).mockResolvedValue({
        team_id: MOCK_AWAY_TEAM.team_id,
      });

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

  describe('uploadLogo', () => {
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    test('uploads a new logo and cleans up the previous one', async () => {
      vi.mocked(uploadFile).mockResolvedValue({
        pathname: 'teams/hcm-new.png',
      } as Awaited<ReturnType<typeof uploadFile>>);

      const result = await uploadLogo(
        MOCK_AWAY_TEAM.team_id,
        MOCK_AWAY_TEAM.image,
        file,
      );

      expect(uploadFile).toHaveBeenCalledWith(
        `teams/${MOCK_AWAY_TEAM.team_id}`,
        file,
        { contentType: file.type },
      );
      expect(updateTeam).toHaveBeenCalledWith(MOCK_AWAY_TEAM.team_id, {
        image: 'teams/hcm-new.png',
      });
      // The previous pathname is removed, never the freshly uploaded File.
      expect(deleteFile).toHaveBeenCalledWith(MOCK_AWAY_TEAM.image);
      expect(deleteFile).not.toHaveBeenCalledWith(file);
      expect(revalidate.teams).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Uploaded logo successfully',
        data: { image: 'teams/hcm-new.png' },
      });
    });

    test('does not delete anything when there is no previous logo', async () => {
      vi.mocked(uploadFile).mockResolvedValue({
        pathname: 'teams/hcm-new.png',
      } as Awaited<ReturnType<typeof uploadFile>>);

      const result = await uploadLogo(MOCK_AWAY_TEAM.team_id, null, file);

      expect(deleteFile).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
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

    test('returns an error when the db operation fails', async () => {
      vi.mocked(deleteTeam).mockRejectedValue(new Error('boom'));

      const result = await removeTeam(MOCK_AWAY_TEAM.team_id);

      expect(revalidate.teams).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Email already exists',
      });
    });
  });
});
