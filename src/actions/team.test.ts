import { getOtherTeams } from '@/db/team';

import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';

import { getOpponents } from './team';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/team', () => ({
  getOtherTeams: vi.fn(),
}));

describe('Team Actions', () => {
  beforeEach(() => {
    vi.mocked(getOtherTeams).mockClear();
  });

  describe('getOpponents', () => {
    test('calls getOtherTeams with withAuth', async () => {
      vi.mocked(getOtherTeams).mockResolvedValue([MOCK_TEAM]);

      const result = await getOpponents();

      expect(mockWithAuth).toHaveBeenCalledWith(getOtherTeams);
      expect(result).toEqual([MOCK_TEAM]);
    });

    test('returns empty array when getOtherTeams returns empty array', async () => {
      vi.mocked(getOtherTeams).mockResolvedValue([]);

      const result = await getOpponents();
      expect(result).toEqual([]);
    });

    test('propagates errors from getOtherTeams', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(getOtherTeams).mockRejectedValue(error);

      await expect(getOpponents()).rejects.toThrow(message);
    });
  });
});
