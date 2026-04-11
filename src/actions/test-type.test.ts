import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTestType,
  getTestTypes as getAction,
  getTestTypeById,
  insertTestType,
  updateTestType,
} from '@/db/test-type';
import { UpsertTestTypeSchemaValues } from '@/schemas/periodic-testing';

import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import {
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
  MOCK_TEST_TYPE_INPUT,
} from '@/test/mocks/periodic-testing';
import { MOCK_TEAM } from '@/test/mocks/team';

import { getTestTypes, removeTestType, upsertTestType } from './test-type';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/test-type', () => ({
  getTestTypes: vi.fn(),
  getTestTypeById: vi.fn(),
  insertTestType: vi.fn(),
  updateTestType: vi.fn(),
  deleteTestType: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    testTypes: vi.fn(),
  },
}));

describe('permissions', () => {
  test('scopes to the periodic-testing resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('periodic-testing');
  });

  test('upsertTestType requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });

  test('removeTestType requires delete action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['delete'],
      expect.objectContaining({ name: 'remove' }),
    );
  });
});

describe('Test Type Actions', () => {
  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTestTypes', () => {
    test('returns all test types', async () => {
      vi.mocked(getAction).mockResolvedValue([
        MOCK_TEST_TYPE,
        MOCK_TEST_TYPE_2,
      ]);

      const result = await getTestTypes();

      expect(getAction).toHaveBeenCalled();
      expect(result).toEqual([MOCK_TEST_TYPE, MOCK_TEST_TYPE_2]);
    });

    test('returns empty array when no test types exist', async () => {
      vi.mocked(getAction).mockResolvedValue([]);

      const result = await getTestTypes();

      expect(result).toEqual([]);
    });

    test('propagates errors from getTestTypes', async () => {
      const message = 'Database error';
      vi.mocked(getAction).mockRejectedValue(new Error(message));

      await expect(getTestTypes()).rejects.toThrow(message);
    });
  });

  describe('upsertTestType', () => {
    const typeData: UpsertTestTypeSchemaValues = {
      name: MOCK_TEST_TYPE_INPUT.name!,
      unit: MOCK_TEST_TYPE_INPUT.unit!,
    };

    test('updates existing test type and revalidates cache', async () => {
      vi.mocked(getTestTypeById).mockResolvedValue(MOCK_TEST_TYPE);
      vi.mocked(updateTestType).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertTestType(MOCK_TEST_TYPE.type_id, typeData);

      expect(getTestTypeById).toHaveBeenCalledWith(MOCK_TEST_TYPE.type_id);
      expect(updateTestType).toHaveBeenCalledWith(
        MOCK_TEST_TYPE.type_id,
        typeData,
      );
      expect(insertTestType).not.toHaveBeenCalled();
      expect(revalidate.testTypes).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Test type updated successfully',
      });
    });

    test('inserts new test type when not found and revalidates cache', async () => {
      vi.mocked(getTestTypeById).mockResolvedValue(undefined);
      vi.mocked(insertTestType).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertTestType('', typeData);

      expect(insertTestType).toHaveBeenCalledWith({
        ...typeData,
        team_id: MOCK_TEAM.team_id,
      });
      expect(updateTestType).not.toHaveBeenCalled();
      expect(revalidate.testTypes).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Test type updated successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(getTestTypeById).mockResolvedValue(MOCK_TEST_TYPE);
      vi.mocked(updateTestType).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertTestType(MOCK_TEST_TYPE.type_id, typeData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.testTypes).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('returns error response when insert fails', async () => {
      const errorMessage = 'Insert failed';
      vi.mocked(getTestTypeById).mockResolvedValue(undefined);
      vi.mocked(insertTestType).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertTestType('', typeData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.testTypes).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Unique constraint violation';
      vi.mocked(getTestTypeById).mockResolvedValue(undefined);
      vi.mocked(insertTestType).mockRejectedValue({
        code: '23505',
        detail: 'Duplicate key',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'team_test_type_name',
      });

      const result = await upsertTestType('', typeData);

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });

  describe('removeTestType', () => {
    test('deletes test type successfully and revalidates cache', async () => {
      vi.mocked(deleteTestType).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeTestType(MOCK_TEST_TYPE.type_id);

      expect(deleteTestType).toHaveBeenCalledWith(MOCK_TEST_TYPE.type_id);
      expect(revalidate.testTypes).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Test type removed successfully',
      });
    });

    test('returns specific error when type is in use', async () => {
      vi.mocked(deleteTestType).mockRejectedValue({ code: '23503' });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Foreign key violation',
        constraint: 'periodic_testing_test_type_id_fkey',
      });

      const result = await removeTestType(MOCK_TEST_TYPE.type_id);

      expect(revalidate.testTypes).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Type is being in use.',
      });
    });

    test('returns generic error when delete fails for other reasons', async () => {
      const errorMessage = 'Delete failed';
      vi.mocked(deleteTestType).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await removeTestType(MOCK_TEST_TYPE.type_id);

      expect(revalidate.testTypes).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });
  });
});
