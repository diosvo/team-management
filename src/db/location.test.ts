import { asc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertLocation, LocationTable } from '@/drizzle/schema';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';

import { MOCK_LOCATION } from '@/test/mocks/location';
import {
  deleteLocation,
  getLocations,
  insertLocation,
  updateLocation,
} from './location';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      LocationTable: {
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

vi.mock('@/drizzle/schema', () => ({
  LocationTable: {
    location_id: 'location_id',
    name: 'name',
  },
}));

describe('getLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns locations when database query succeeds', async () => {
    vi.mocked(db.query.LocationTable.findMany).mockResolvedValue([
      MOCK_LOCATION,
    ]);

    const result = await getLocations();

    expect(result).toEqual([MOCK_LOCATION]);
    // Verify query construction
    expect(db.query.LocationTable.findMany).toHaveBeenCalledWith({
      orderBy: asc(LocationTable.name),
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
      vi.mocked(db.query.LocationTable.findMany).mockRejectedValue(mockError);

      const result = await getLocations();
      expect(result).toEqual([]);
    },
  );
});

describe('insertLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts location successfully', async () => {
    const mockValues = mockInsertSuccess({
      location_id: MOCK_LOCATION.location_id,
    });

    const result = await insertLocation(MOCK_LOCATION);

    expect(result).toEqual({ location_id: MOCK_LOCATION.location_id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(LocationTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_LOCATION);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(insertLocation(MOCK_LOCATION)).rejects.toThrow(message);
  });
});

describe('updateLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const updatedLocation: InsertLocation = {
    ...MOCK_LOCATION,
    name: 'Updated Stadium',
  };

  test('updates location successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess({
      location_id: MOCK_LOCATION.location_id,
    });

    const result = await updateLocation(
      MOCK_LOCATION.location_id!,
      updatedLocation,
    );

    expect(result).toEqual({ location_id: MOCK_LOCATION.location_id });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(LocationTable);
    expect(mockSet).toHaveBeenCalledWith(updatedLocation);
    expect(eq).toHaveBeenCalledWith(
      LocationTable.location_id,
      MOCK_LOCATION.location_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: LocationTable.location_id,
      value: MOCK_LOCATION.location_id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateLocation(MOCK_LOCATION.location_id!, updatedLocation),
    ).rejects.toThrow(message);
  });
});

describe('deleteLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes location successfully', async () => {
    const mockWhere = mockDeleteSuccess({
      location_id: MOCK_LOCATION.location_id,
    });

    const result = await deleteLocation(MOCK_LOCATION.location_id!);

    expect(result).toEqual({ location_id: MOCK_LOCATION.location_id });
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(LocationTable);
    expect(eq).toHaveBeenCalledWith(
      LocationTable.location_id,
      MOCK_LOCATION.location_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: LocationTable.location_id,
      value: MOCK_LOCATION.location_id,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(deleteLocation(MOCK_LOCATION.location_id!)).rejects.toThrow(
      message,
    );
  });
});
