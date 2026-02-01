import { revalidate } from '@/actions/cache';
import {
  deleteLocation,
  getLocations as getDbLocations,
  insertLocation as insertDbLocation,
  updateLocation as updateDbLocation,
} from '@/db/location';
import { getDbErrorMessage } from '@/db/pg-error';

import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_LOCATION } from '@/test/mocks/location';

import { getLocations, removeLocation, upsertLocation } from './location';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/location', () => ({
  getLocations: vi.fn(),
  insertLocation: vi.fn(),
  updateLocation: vi.fn(),
  deleteLocation: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    locations: vi.fn(),
  },
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(),
}));

describe('Location Actions', () => {
  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLocations', () => {
    test('calls getLocations', async () => {
      vi.mocked(getDbLocations).mockResolvedValue([MOCK_LOCATION]);

      const result = await getLocations();

      expect(getDbLocations).toHaveBeenCalled();
      expect(result).toEqual([MOCK_LOCATION]);
    });

    test('returns empty array when no locations exist', async () => {
      vi.mocked(getDbLocations).mockResolvedValue([]);

      const result = await getLocations();
      expect(result).toEqual([]);
    });

    test('propagates errors from getLocations', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(getDbLocations).mockRejectedValue(error);

      await expect(getLocations()).rejects.toThrow(message);
    });
  });

  describe('upsertLocation', () => {
    test('updates existing location and revalidates cache', async () => {
      vi.mocked(updateDbLocation).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertLocation(
        MOCK_LOCATION.location_id!,
        MOCK_LOCATION,
      );

      expect(updateDbLocation).toHaveBeenCalledWith(
        MOCK_LOCATION.location_id,
        MOCK_LOCATION,
      );
      expect(insertDbLocation).not.toHaveBeenCalled();
      expect(revalidate.locations).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated location successfully',
      });
    });

    test('inserts new location when location_id is empty', async () => {
      vi.mocked(insertDbLocation).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertLocation('', MOCK_LOCATION);

      expect(insertDbLocation).toHaveBeenCalledWith(MOCK_LOCATION);
      expect(updateDbLocation).not.toHaveBeenCalled();
      expect(revalidate.locations).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added location successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateDbLocation).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertLocation(
        MOCK_LOCATION.location_id!,
        MOCK_LOCATION,
      );

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.locations).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('returns error response when insert fails', async () => {
      const errorMessage = 'Insert failed';
      vi.mocked(insertDbLocation).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertLocation('', MOCK_LOCATION);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.locations).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Unique constraint violation';
      vi.mocked(updateDbLocation).mockRejectedValue({
        code: '23505',
        detail: 'Duplicate key',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'unique_location_name',
      });

      const result = await upsertLocation(
        MOCK_LOCATION.location_id!,
        MOCK_LOCATION,
      );

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });

  describe('removeLocation', () => {
    test('deletes location successfully and revalidates cache', async () => {
      vi.mocked(deleteLocation).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeLocation(MOCK_LOCATION.location_id!);

      expect(deleteLocation).toHaveBeenCalledWith(MOCK_LOCATION.location_id);
      expect(revalidate.locations).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Deleted location successfully',
      });
    });

    test('returns error response when delete fails', async () => {
      vi.mocked(deleteLocation).mockRejectedValue(new Error('Delete failed'));

      const result = await removeLocation(MOCK_LOCATION.location_id!);

      expect(deleteLocation).toHaveBeenCalledWith(MOCK_LOCATION.location_id);
      expect(revalidate.locations).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Failed to delete location',
      });
    });

    test('handles non-error exceptions', async () => {
      vi.mocked(deleteLocation).mockRejectedValue('Unknown error');

      const result = await removeLocation(MOCK_LOCATION.location_id!);

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete location',
      });
    });
  });
});
