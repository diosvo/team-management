import { revalidate } from '@/actions/cache';
import {
  deleteLocation,
  insertLocation,
  selectLocations,
  updateLocation,
} from '@/db/location';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import { MOCK_LOCATION } from '@/test/mocks/location';

import { getLocations, removeLocation, upsertLocation } from './location';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/location', () => ({
  selectLocations: vi.fn(),
  insertLocation: vi.fn(),
  updateLocation: vi.fn(),
  deleteLocation: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    locations: vi.fn(),
  },
}));

describe('permissions', () => {
  test('scopes to the locations resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('locations');
  });

  test('upsertLocation requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeLocation requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

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
      vi.mocked(selectLocations).mockResolvedValue([MOCK_LOCATION]);

      const result = await getLocations();

      expect(selectLocations).toHaveBeenCalled();
      expect(result).toEqual([MOCK_LOCATION]);
    });

    test('returns empty array when no locations exist', async () => {
      vi.mocked(selectLocations).mockResolvedValue([]);

      const result = await getLocations();
      expect(result).toEqual([]);
    });

    test('propagates errors from getLocations', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(selectLocations).mockRejectedValue(error);

      await expect(getLocations()).rejects.toThrow(message);
    });
  });

  describe('upsertLocation', () => {
    test('updates existing location and revalidates cache', async () => {
      vi.mocked(updateLocation).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertLocation(
        MOCK_LOCATION.location_id!,
        MOCK_LOCATION,
      );

      expect(updateLocation).toHaveBeenCalledWith(
        MOCK_LOCATION.location_id,
        MOCK_LOCATION,
      );
      expect(insertLocation).not.toHaveBeenCalled();
      expect(revalidate.locations).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated location successfully',
      });
    });

    test('inserts new location when location_id is empty', async () => {
      vi.mocked(insertLocation).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertLocation('', MOCK_LOCATION);

      expect(insertLocation).toHaveBeenCalledWith(MOCK_LOCATION);
      expect(updateLocation).not.toHaveBeenCalled();
      expect(revalidate.locations).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added location successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateLocation).mockRejectedValue(new Error(errorMessage));
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
      vi.mocked(insertLocation).mockRejectedValue(new Error(errorMessage));
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
      vi.mocked(updateLocation).mockRejectedValue({
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
