import { cacheTag } from 'next/cache';

import { eq } from 'drizzle-orm';

import { getCacheTag } from '@/actions/cache';
import db from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

import { MOCK_TEAM } from '@/test/mocks/team';

import { getOtherTeams } from './team';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      TeamTable: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/drizzle/schema/team', () => ({
  TeamTable: {
    is_default: 'is_default',
  },
}));

vi.mock('@/actions/cache', () => ({
  getCacheTag: {
    opponents: vi.fn(() => 'opponents'),
  },
}));

describe('getOtherTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns teams when database query succeeds', async () => {
    vi.mocked(db.query.TeamTable.findMany).mockResolvedValue([MOCK_TEAM]);

    const result = await getOtherTeams();

    // Don't care about exact db query result here
    expect(result).toEqual([MOCK_TEAM]);
    expect(cacheTag).toHaveBeenCalledWith('opponents');
    expect(getCacheTag.opponents).toHaveBeenCalled();
    // Verify query construction
    expect(db.query.TeamTable.findMany).toHaveBeenCalledWith({
      where: eq(TeamTable.is_default, false),
    });
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exception',
      mockError: 'Duplicated Key',
    },
  ])(
    'returns empty array when database query $description',
    async ({ mockError }) => {
      vi.mocked(db.query.TeamTable.findMany).mockRejectedValue(mockError);

      const result = await getOtherTeams();
      expect(result).toEqual([]);
    },
  );
});
