import { desc, eq } from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import db from '@/drizzle';
import { AssetTable, InsertAsset } from '@/drizzle/schema/asset';

import { getCacheTag } from '@/actions/cache';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import {
  MOCK_ASSET,
  MOCK_ASSET_INPUT,
  MOCK_ASSET_STATS,
} from '@/test/mocks/asset';
import { MOCK_TEAM } from '@/test/mocks/team';

import { deleteAsset, getAssets, insertAsset, updateAsset } from './asset';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      AssetTable: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
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

vi.mock('@/drizzle/schema/asset', () => ({
  AssetTable: {
    team_id: 'team_id',
    asset_id: 'asset_id',
    condition: 'condition',
  },
}));

vi.mock('@/actions/cache', () => ({
  getCacheTag: {
    assets: vi.fn(() => 'assets'),
  },
}));

describe('getAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns assets with stats when database query succeeds', async () => {
    vi.mocked(db.query.AssetTable.findMany).mockResolvedValue([MOCK_ASSET]);

    const result = await getAssets(MOCK_TEAM.team_id);

    expect(result).toEqual({
      stats: MOCK_ASSET_STATS,
      data: [MOCK_ASSET],
    });
    expect(cacheTag).toHaveBeenCalledWith('assets');
    expect(getCacheTag.assets).toHaveBeenCalled();
    // Verify query construction
    expect(db.query.AssetTable.findMany).toHaveBeenCalledWith({
      where: eq(AssetTable.team_id, MOCK_TEAM.team_id),
      orderBy: desc(AssetTable.updated_at),
    });
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exceptions',
      mockError: 'Unknown error',
    },
  ])(
    'returns default stats when database query $description',
    async ({ mockError }) => {
      vi.mocked(db.query.AssetTable.findMany).mockRejectedValue(mockError);

      const result = await getAssets(MOCK_TEAM.team_id);
      expect(result).toEqual({
        stats: { total_items: 0, need_replacement: 0 },
        data: [],
      });
    },
  );
});

describe('insertAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInsertData: InsertAsset = {
    team_id: MOCK_TEAM.team_id,
    ...MOCK_ASSET_INPUT,
  };

  test('inserts asset successfully', async () => {
    const mockValues = mockInsertSuccess({ asset_id: MOCK_ASSET.asset_id });

    const result = await insertAsset(mockInsertData);

    expect(result).toEqual({ asset_id: MOCK_ASSET.asset_id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(AssetTable);
    expect(mockValues).toHaveBeenCalledWith(mockInsertData);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(insertAsset(mockInsertData)).rejects.toThrow(message);
  });
});

describe('updateAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const updatedAsset: InsertAsset = {
    team_id: MOCK_TEAM.team_id,
    ...MOCK_ASSET_INPUT,
  };

  test('updates asset successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess({
      asset_id: MOCK_ASSET.asset_id,
    });

    const result = await updateAsset(MOCK_ASSET.asset_id, updatedAsset);

    expect(result).toEqual({ asset_id: MOCK_ASSET.asset_id });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(AssetTable);
    expect(mockSet).toHaveBeenCalledWith(updatedAsset);
    expect(eq).toHaveBeenCalledWith(AssetTable.asset_id, MOCK_ASSET.asset_id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: AssetTable.asset_id,
      value: MOCK_ASSET.asset_id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateAsset(MOCK_ASSET.asset_id, updatedAsset),
    ).rejects.toThrow(message);
  });
});

describe('deleteAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes asset successfully', async () => {
    const mockWhere = mockDeleteSuccess({ asset_id: MOCK_ASSET.asset_id });

    const result = await deleteAsset(MOCK_ASSET.asset_id);

    expect(result).toEqual({ asset_id: MOCK_ASSET.asset_id });
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(AssetTable);
    expect(eq).toHaveBeenCalledWith(AssetTable.asset_id, MOCK_ASSET.asset_id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: AssetTable.asset_id,
      value: MOCK_ASSET.asset_id,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(deleteAsset(MOCK_ASSET.asset_id)).rejects.toThrow(message);
  });
});
