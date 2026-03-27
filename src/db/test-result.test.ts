import { and, desc, eq, gte, lte } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertTestResult, TestResultTable } from '@/drizzle/schema';

import {
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import {
  MOCK_TEST_RESULT,
  MOCK_TEST_RESULT_DATE,
  MOCK_TEST_RESULT_DB_ROW,
  MOCK_TEST_RESULT_INPUT,
  MOCK_TEST_RESULT_RESPONSE,
} from '@/test/mocks/periodic-testing';

import {
  getDates,
  getTestResultByDate,
  getTestResultByUserAndTypeIds,
  insertTestResult,
  updateTestResultById,
  updateTestResults,
} from './test-result';

vi.mock('@/drizzle', () => ({
  default: {
    selectDistinct: vi.fn(),
    query: {
      TestResultTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
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
  },
}));

vi.mock('@/drizzle/schema', () => ({
  TestResultTable: {
    result_id: 'result_id',
    player_id: 'player_id',
    type_id: 'type_id',
    date: 'date',
  },
}));

function mockSelectDistinctSuccess(returnValue: unknown) {
  const mockOrderBy = vi.fn().mockResolvedValue(returnValue);
  const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  vi.mocked(db.selectDistinct).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.selectDistinct>);
  return { mockFrom, mockOrderBy };
}

function mockSelectDistinctFailure() {
  const mockOrderBy = vi.fn().mockRejectedValue(new Error('Database error'));
  const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  vi.mocked(db.selectDistinct).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.selectDistinct>);
}

describe('getDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns distinct non-null dates ordered by desc', async () => {
    mockSelectDistinctSuccess([
      { date: MOCK_TEST_RESULT_DATE },
      { date: null },
    ]);

    const result = await getDates();

    expect(result).toEqual([MOCK_TEST_RESULT_DATE]);
    expect(db.selectDistinct).toHaveBeenCalledWith({
      date: TestResultTable.date,
    });
  });

  test('returns empty array when no dates exist', async () => {
    mockSelectDistinctSuccess([]);

    const result = await getDates();

    expect(result).toEqual([]);
  });

  test('returns empty array when database query fails', async () => {
    mockSelectDistinctFailure();

    const result = await getDates();

    expect(result).toEqual([]);
  });
});

describe('getTestResultByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns headers and players for a given date', async () => {
    vi.mocked(db.query.TestResultTable.findMany).mockResolvedValue([
      MOCK_TEST_RESULT_DB_ROW,
    ]);

    const result = await getTestResultByDate(MOCK_TEST_RESULT_DATE);

    expect(result).toEqual(MOCK_TEST_RESULT_RESPONSE);
    expect(db.query.TestResultTable.findMany).toHaveBeenCalledWith({
      with: {
        player: { with: { user: true } },
        type: { columns: { type_id: true, name: true, unit: true } },
      },
      where: eq(TestResultTable.date, MOCK_TEST_RESULT_DATE),
    });
  });

  test('returns empty headers and players when no results exist', async () => {
    vi.mocked(db.query.TestResultTable.findMany).mockResolvedValue([]);

    const result = await getTestResultByDate(MOCK_TEST_RESULT_DATE);

    expect(result).toEqual({ headers: [], players: [] });
  });

  test('returns empty headers and players when database query fails', async () => {
    vi.mocked(db.query.TestResultTable.findMany).mockRejectedValue(
      new Error('Database error'),
    );

    const result = await getTestResultByDate(MOCK_TEST_RESULT_DATE);

    expect(result).toEqual({ headers: [], players: [] });
  });
});

describe('getTestResultByUserAndTypeIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns test result when found', async () => {
    vi.mocked(db.query.TestResultTable.findFirst).mockResolvedValue(
      MOCK_TEST_RESULT,
    );

    const result = await getTestResultByUserAndTypeIds(MOCK_TEST_RESULT_INPUT);

    expect(result).toEqual(MOCK_TEST_RESULT);
    expect(db.query.TestResultTable.findFirst).toHaveBeenCalledWith({
      where: and(
        and(
          gte(TestResultTable.date, MOCK_TEST_RESULT_INPUT.date!),
          lte(TestResultTable.date, MOCK_TEST_RESULT_INPUT.date!),
        ),
        eq(TestResultTable.player_id, MOCK_TEST_RESULT_INPUT.player_id),
        eq(TestResultTable.type_id, MOCK_TEST_RESULT_INPUT.type_id),
      ),
    });
  });

  test('returns undefined when no matching result found', async () => {
    vi.mocked(db.query.TestResultTable.findFirst).mockResolvedValue(undefined);

    const result = await getTestResultByUserAndTypeIds(MOCK_TEST_RESULT_INPUT);

    expect(result).toBeUndefined();
  });

  test('returns null when database query fails', async () => {
    vi.mocked(db.query.TestResultTable.findFirst).mockRejectedValue(
      new Error('Database error'),
    );

    const result = await getTestResultByUserAndTypeIds(MOCK_TEST_RESULT_INPUT);

    expect(result).toBeNull();
  });
});

describe('insertTestResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts test results successfully', async () => {
    const mockValues = mockInsertSuccess([MOCK_TEST_RESULT]);

    const result = await insertTestResult([MOCK_TEST_RESULT_INPUT]);

    expect(result).toEqual([MOCK_TEST_RESULT]);
    expect(db.insert).toHaveBeenCalledWith(TestResultTable);
    expect(mockValues).toHaveBeenCalledWith([MOCK_TEST_RESULT_INPUT]);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(
      insertTestResult([{} as InsertTestResult]),
    ).rejects.toThrow(message);
  });
});

describe('updateTestResultById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates test result successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess(MOCK_TEST_RESULT);
    const updateData: Partial<InsertTestResult> = {
      result_id: MOCK_TEST_RESULT.result_id,
      result: '5.000',
    };

    const result = await updateTestResultById(updateData);

    expect(result).toEqual(MOCK_TEST_RESULT);
    expect(db.update).toHaveBeenCalledWith(TestResultTable);
    expect(mockSet).toHaveBeenCalledWith(updateData);
    expect(eq).toHaveBeenCalledWith(
      TestResultTable.result_id,
      MOCK_TEST_RESULT.result_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: TestResultTable.result_id,
      value: MOCK_TEST_RESULT.result_id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateTestResultById({ result_id: MOCK_TEST_RESULT.result_id }),
    ).rejects.toThrow(message);
  });
});

describe('updateTestResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates multiple test results successfully', async () => {
    const { mockWhere } = mockUpdateSuccess(MOCK_TEST_RESULT);

    await updateTestResults([
      { ...MOCK_TEST_RESULT_INPUT, result_id: MOCK_TEST_RESULT.result_id },
    ]);

    expect(db.update).toHaveBeenCalledWith(TestResultTable);
    expect(mockWhere).toHaveBeenCalled();
  });

  test('throws error when any update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateTestResults([
        { ...MOCK_TEST_RESULT_INPUT, result_id: MOCK_TEST_RESULT.result_id },
      ]),
    ).rejects.toThrow(message);
  });
});
