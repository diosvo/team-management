import { revalidate } from '@/actions/cache';
import { InsertTestResult } from '@/drizzle/schema';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  getDates,
  getTestResultByDate,
  getTestResultByUserAndTypeIds,
  insertTestResult,
  updateTestResultById as updateAction,
  updateTestResults,
} from '@/db/test-result';

import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import {
  MOCK_TEST_RESULT,
  MOCK_TEST_RESULT_DATE,
  MOCK_TEST_RESULT_INPUT,
  MOCK_TEST_RESULT_RESPONSE,
} from '@/test/mocks/periodic-testing';

import {
  createTestResult,
  getTestDates,
  getTestResult,
  updateTestResultById,
} from './test-result';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/test-result', () => ({
  getDates: vi.fn(),
  getTestResultByDate: vi.fn(),
  getTestResultByUserAndTypeIds: vi.fn(),
  insertTestResult: vi.fn(),
  updateTestResultById: vi.fn(),
  updateTestResults: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    testResults: vi.fn(),
  },
}));

describe('permissions', () => {
  test('scopes to the periodic-testing resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('periodic-testing');
  });

  test('createTestResult requires create action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create'],
      expect.objectContaining({ name: 'create' }),
    );
  });

  test('updateTestResultById requires edit action', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['edit'],
      expect.objectContaining({ name: 'updateById' }),
    );
  });
});

describe('Test Result Actions', () => {
  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTestDates', () => {
    test('returns list of dates', async () => {
      vi.mocked(getDates).mockResolvedValue([MOCK_TEST_RESULT_DATE]);

      const result = await getTestDates();

      expect(getDates).toHaveBeenCalled();
      expect(result).toEqual([MOCK_TEST_RESULT_DATE]);
    });

    test('returns empty array when no dates exist', async () => {
      vi.mocked(getDates).mockResolvedValue([]);

      const result = await getTestDates();

      expect(result).toEqual([]);
    });

    test('propagates errors from getDates', async () => {
      const message = 'Database error';
      vi.mocked(getDates).mockRejectedValue(new Error(message));

      await expect(getTestDates()).rejects.toThrow(message);
    });
  });

  describe('getTestResult', () => {
    test('returns test result for a given date', async () => {
      vi.mocked(getTestResultByDate).mockResolvedValue(
        MOCK_TEST_RESULT_RESPONSE,
      );

      const result = await getTestResult(MOCK_TEST_RESULT_DATE);

      expect(getTestResultByDate).toHaveBeenCalledWith(MOCK_TEST_RESULT_DATE);
      expect(result).toEqual(MOCK_TEST_RESULT_RESPONSE);
    });

    test('returns empty response when date is empty string', async () => {
      const result = await getTestResult('');

      expect(getTestResultByDate).not.toHaveBeenCalled();
      expect(result).toEqual({ headers: [], players: [] });
    });

    test('propagates errors from getTestResultByDate', async () => {
      const message = 'Database error';
      vi.mocked(getTestResultByDate).mockRejectedValue(new Error(message));

      await expect(getTestResult(MOCK_TEST_RESULT_DATE)).rejects.toThrow(
        message,
      );
    });
  });

  describe('createTestResult', () => {
    const newResult: InsertTestResult = {
      ...MOCK_TEST_RESULT_INPUT,
      type_id: 'type-new',
    };

    test('creates new results when none exist', async () => {
      vi.mocked(getTestResultByUserAndTypeIds).mockResolvedValue(undefined);
      vi.mocked(insertTestResult).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await createTestResult([MOCK_TEST_RESULT_INPUT]);

      expect(getTestResultByUserAndTypeIds).toHaveBeenCalledWith(
        MOCK_TEST_RESULT_INPUT,
      );
      expect(insertTestResult).toHaveBeenCalledWith([MOCK_TEST_RESULT_INPUT]);
      expect(updateTestResults).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: '1 created, 0 updated',
      });
    });

    test('updates existing results when they already exist', async () => {
      vi.mocked(getTestResultByUserAndTypeIds).mockResolvedValue(
        MOCK_TEST_RESULT,
      );
      vi.mocked(updateTestResults).mockResolvedValue([
        { ...mockResult, command: 'UPDATE' },
      ]);

      const result = await createTestResult([MOCK_TEST_RESULT_INPUT]);

      expect(getTestResultByUserAndTypeIds).toHaveBeenCalledWith(
        MOCK_TEST_RESULT_INPUT,
      );
      expect(updateTestResults).toHaveBeenCalledWith([
        { ...MOCK_TEST_RESULT_INPUT, result_id: MOCK_TEST_RESULT.result_id },
      ]);
      expect(insertTestResult).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: '0 created, 1 updated',
      });
    });

    test('handles mixed create and update in batch', async () => {
      vi.mocked(getTestResultByUserAndTypeIds)
        .mockResolvedValueOnce(MOCK_TEST_RESULT) // first result exists
        .mockResolvedValueOnce(undefined); // second result is new
      vi.mocked(updateTestResults).mockResolvedValue([
        { ...mockResult, command: 'UPDATE' },
      ]);
      vi.mocked(insertTestResult).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await createTestResult([
        MOCK_TEST_RESULT_INPUT,
        newResult,
      ]);

      expect(insertTestResult).toHaveBeenCalledWith([newResult]);
      expect(updateTestResults).toHaveBeenCalledWith([
        { ...MOCK_TEST_RESULT_INPUT, result_id: MOCK_TEST_RESULT.result_id },
      ]);
      expect(result).toEqual({
        success: true,
        message: '1 created, 1 updated',
      });
    });

    test('returns error response when batch operation fails', async () => {
      const errorMessage = 'Insert failed';
      vi.mocked(getTestResultByUserAndTypeIds).mockResolvedValue(undefined);
      vi.mocked(insertTestResult).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await createTestResult([MOCK_TEST_RESULT_INPUT]);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe('updateTestResultById', () => {
    const updateData: Partial<InsertTestResult> = {
      result_id: MOCK_TEST_RESULT.result_id,
      result: '5.000',
    };

    test('updates test result and revalidates cache', async () => {
      vi.mocked(updateAction).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await updateTestResultById(updateData);

      expect(updateAction).toHaveBeenCalledWith(updateData);
      expect(revalidate.testResults).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Test result updated successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateAction).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await updateTestResultById(updateData);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.testResults).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Foreign key violation';
      vi.mocked(updateAction).mockRejectedValue({ code: '23503' });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'fk_test_result',
      });

      const result = await updateTestResultById(updateData);

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });
});
