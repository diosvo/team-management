import { vi } from 'vitest';

import { revalidate } from '@/actions/cache';
import {
  deleteAsset,
  getAssets as getDbAssets,
  insertAsset as insertDbAsset,
  updateAsset as updateDbAsset,
} from '@/db/asset';
import { getDbErrorMessage } from '@/db/pg-error';

import { MOCK_ASSET, MOCK_ASSET_INPUT } from '@/test/mocks/asset';
import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';

import { getAssets, removeAsset, upsertAsset } from './asset';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/asset', () => ({
  getAssets: vi.fn(),
  insertAsset: vi.fn(),
  updateAsset: vi.fn(),
  deleteAsset: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    assets: vi.fn(),
  },
}));

const MOCK_ASSETS_RESPONSE = {
  stats: {
    total_items: 1,
    need_replacement: 0,
  },
  data: [MOCK_ASSET],
};

describe('Asset Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };

  describe('getAssets', () => {
    test('calls getAssets with team_id', async () => {
      vi.mocked(getDbAssets).mockResolvedValue(MOCK_ASSETS_RESPONSE);

      const result = await getAssets();

      expect(getDbAssets).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(MOCK_ASSETS_RESPONSE);
    });

    test('returns empty response when no assets exist', async () => {
      const emptyResponse = {
        stats: { total_items: 0, need_replacement: 0 },
        data: [],
      };
      vi.mocked(getDbAssets).mockResolvedValue(emptyResponse);

      const result = await getAssets();
      expect(result).toEqual(emptyResponse);
    });

    test('propagates errors from getAssets', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(getDbAssets).mockRejectedValue(error);

      await expect(getAssets()).rejects.toThrow(message);
    });
  });

  describe('upsertAsset', () => {
    test('updates existing asset and revalidates cache', async () => {
      vi.mocked(updateDbAsset).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertAsset(MOCK_ASSET.asset_id, MOCK_ASSET_INPUT);

      expect(updateDbAsset).toHaveBeenCalledWith(MOCK_ASSET.asset_id, {
        ...MOCK_ASSET_INPUT,
        team_id: MOCK_TEAM.team_id,
      });
      expect(insertDbAsset).not.toHaveBeenCalled();
      expect(revalidate.assets).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated asset successfully',
      });
    });

    test('inserts new asset when asset_id is empty', async () => {
      vi.mocked(insertDbAsset).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertAsset('', MOCK_ASSET_INPUT);

      expect(insertDbAsset).toHaveBeenCalledWith({
        ...MOCK_ASSET_INPUT,
        team_id: MOCK_TEAM.team_id,
      });
      expect(updateDbAsset).not.toHaveBeenCalled();
      expect(revalidate.assets).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added asset successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateDbAsset).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertAsset(MOCK_ASSET.asset_id, MOCK_ASSET_INPUT);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.assets).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('returns error response when insert fails', async () => {
      const errorMessage = 'Insert failed';
      vi.mocked(insertDbAsset).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertAsset('', MOCK_ASSET_INPUT);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.assets).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Unique constraint violation';
      vi.mocked(updateDbAsset).mockRejectedValue({
        code: '23505',
        detail: 'Duplicate key',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'unique_asset_name',
      });

      const result = await upsertAsset(MOCK_ASSET.asset_id, MOCK_ASSET_INPUT);

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });

  describe('removeAsset', () => {
    test('deletes asset successfully and revalidates cache', async () => {
      vi.mocked(deleteAsset).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeAsset(MOCK_ASSET.asset_id);

      expect(deleteAsset).toHaveBeenCalledWith(MOCK_ASSET.asset_id);
      expect(revalidate.assets).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Asset deleted successfully',
      });
    });

    test('returns error response when delete fails', async () => {
      vi.mocked(deleteAsset).mockRejectedValue(new Error('Delete failed'));

      const result = await removeAsset(MOCK_ASSET.asset_id);

      expect(deleteAsset).toHaveBeenCalledWith(MOCK_ASSET.asset_id);
      expect(revalidate.assets).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Failed to delete asset',
      });
    });

    test('handles non-error exceptions', async () => {
      vi.mocked(deleteAsset).mockRejectedValue('Unknown error');

      const result = await removeAsset(MOCK_ASSET.asset_id);

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete asset',
      });
    });
  });
});
