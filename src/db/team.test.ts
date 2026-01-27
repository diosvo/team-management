import { cacheTag } from 'next/cache';

import { eq } from 'drizzle-orm';
import { vi } from 'vitest';

import { getCacheTag } from '@/actions/cache';
import db from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

import { MOCK_TEAM } from '@/test/mocks/team';

import { getOtherTeams } from './team';

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
}));

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
    expect(eq).toHaveBeenCalledWith(TeamTable.is_default, false);
    expect(db.query.TeamTable.findMany).toHaveBeenCalledWith({
      where: { field: TeamTable.is_default, value: false, type: 'eq' },
    });
  });

  test('returns empty array when database query fails', async () => {
    const error = new Error('Database error');
    vi.mocked(db.query.TeamTable.findMany).mockRejectedValue(error);

    const result = await getOtherTeams();
    expect(result).toEqual([]);
  });

  test('returns empty array when database query throws non-error exception', async () => {
    vi.mocked(db.query.TeamTable.findMany).mockRejectedValue('Duplicated Key');

    const result = await getOtherTeams();
    expect(result).toEqual([]);
  });
});
