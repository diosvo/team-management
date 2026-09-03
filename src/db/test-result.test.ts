import { desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import {
  type InsertTestResult,
  TestResultTable,
} from '@/drizzle/schema/periodic-testing';

import {
  mockInsertFailure,
  mockInsertSuccess,
  mockSelectDistinctFailure,
  mockSelectDistinctSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import {
  MOCK_TEST_PLAYER_2,
  MOCK_TEST_RESULT,
  MOCK_TEST_RESULT_DATE,
  MOCK_TEST_RESULT_DB_ROW,
  MOCK_TEST_RESULT_INPUT,
} from '@/test/mocks/periodic-testing';

import {
  getDates,
  getExistingTestResults,
  getTestResultByDate,
  insertTestResult,
  updateTestResultById,
  updateTestResults,
} from './test-result';

vi.mock('@/drizzle', () => ({
  default: {
    select: vi.fn(),
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

vi.mock('@/drizzle/schema/periodic-testing', () => ({
  TestResultTable: {
    result_id: 'result_id',
    player_id: 'player_id',
    type_id: 'type_id',
    date: 'date',
  },
}));

describe('getDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('flattens the distinct dates the query returns', async () => {
    const { mockFrom, mockOrderBy } = mockSelectDistinctSuccess([
      { date: '2026-01-16' },
      { date: MOCK_TEST_RESULT_DATE },
      { date: '2026-01-14' },
    ]);

    const result = await getDates();

    expect(result).toEqual(['2026-01-16', MOCK_TEST_RESULT_DATE, '2026-01-14']);
    expect(db.selectDistinct).toHaveBeenCalledWith({
      date: TestResultTable.date,
    });
    expect(mockFrom).toHaveBeenCalledWith(TestResultTable);
    expect(mockOrderBy).toHaveBeenCalledWith(desc(TestResultTable.date));
  });

  test('returns empty array when no dates exist', async () => {
    mockSelectDistinctSuccess([]);

    const result = await getDates();

    expect(result).toEqual([]);
  });

  test('returns empty array when database query fails', async () => {
    mockSelectDistinctFailure('Database error');

    const result = await getDates();

    expect(result).toEqual([]);
  });
});

describe('getTestResultByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns headers and players for a given date', async () => {
    // A second player with the same test type exercises player aggregation
    // and header de-duplication (headers are derived from the result rows).
    const secondRow = {
      ...MOCK_TEST_RESULT_DB_ROW,
      result_id: 'result-456',
      result: '5.100',
      player_id: MOCK_TEST_PLAYER_2.id,
      player: {
        ...MOCK_TEST_RESULT_DB_ROW.player,
        id: MOCK_TEST_PLAYER_2.id,
        user: MOCK_TEST_PLAYER_2,
      },
    };

    vi.mocked(db.query.TestResultTable.findMany).mockResolvedValue([
      MOCK_TEST_RESULT_DB_ROW,
      secondRow,
    ]);

    const result = await getTestResultByDate(MOCK_TEST_RESULT_DATE);

    expect(result).toEqual({
      headers: [
        {
          type_id: MOCK_TEST_RESULT_DB_ROW.type.type_id,
          name: MOCK_TEST_RESULT_DB_ROW.type.name,
          unit: MOCK_TEST_RESULT_DB_ROW.type.unit,
        },
      ],
      players: [
        {
          player_id: MOCK_TEST_RESULT_DB_ROW.player_id,
          player_name: MOCK_TEST_RESULT_DB_ROW.player.user.name,
          tests: {
            [MOCK_TEST_RESULT_DB_ROW.type.name]: {
              result_id: MOCK_TEST_RESULT.result_id,
              result: MOCK_TEST_RESULT_INPUT.result,
            },
          },
        },
        {
          player_id: MOCK_TEST_PLAYER_2.id,
          player_name: MOCK_TEST_PLAYER_2.name,
          tests: {
            [MOCK_TEST_RESULT_DB_ROW.type.name]: {
              result_id: 'result-456',
              result: '5.100',
            },
          },
        },
      ],
    });
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

describe('getExistingTestResults', () => {
  const key = ({ date, player_id, type_id }: InsertTestResult) =>
    `${date ?? ''}|${player_id}|${type_id}`;

  const mockSelect = (rows: Array<unknown>) => {
    const where = vi.fn().mockResolvedValue(rows);
    const from = vi.fn().mockReturnValue({ where });
    vi.mocked(db.select).mockReturnValue({ from } as never);
    return { from, where };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns an empty map without querying when nothing is submitted', async () => {
    const result = await getExistingTestResults([]);

    expect(result.size).toBe(0);
    expect(db.select).not.toHaveBeenCalled();
  });

  test('maps every submitted cell that already exists to its result_id', async () => {
    mockSelect([MOCK_TEST_RESULT]);

    const result = await getExistingTestResults([MOCK_TEST_RESULT_INPUT]);

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(result.get(key(MOCK_TEST_RESULT_INPUT))).toBe(
      MOCK_TEST_RESULT.result_id,
    );
  });

  test('ignores rows outside the submitted cells', async () => {
    // The IN filters return the cross product, so a row for another player's
    // test type can come back even though it was never submitted
    mockSelect([{ ...MOCK_TEST_RESULT, player_id: MOCK_TEST_PLAYER_2.id }]);

    const result = await getExistingTestResults([MOCK_TEST_RESULT_INPUT]);

    expect(result.size).toBe(0);
  });

  test('uses the required date value when resolving existing rows', async () => {
    mockSelect([MOCK_TEST_RESULT]);

    await getExistingTestResults([
      { ...MOCK_TEST_RESULT_INPUT, date: '2026-01-15' },
    ]);

    expect(db.select).toHaveBeenCalledTimes(1);
  });

  test('propagates database errors', async () => {
    const from = vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('Database error')),
    });
    vi.mocked(db.select).mockReturnValue({ from } as never);

    await expect(
      getExistingTestResults([MOCK_TEST_RESULT_INPUT]),
    ).rejects.toThrow('Database error');
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

    await expect(insertTestResult([{} as InsertTestResult])).rejects.toThrow(
      message,
    );
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
