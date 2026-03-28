import { asc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertTestType, TestTypeTable } from '@/drizzle/schema';

import { UpsertTestTypeSchemaValues } from '@/schemas/periodic-testing';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import {
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
  MOCK_TEST_TYPE_INPUT,
} from '@/test/mocks/periodic-testing';

import {
  deleteTestType,
  getTestTypeById,
  getTestTypes,
  insertTestType,
  updateTestType,
} from './test-type';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      TestTypeTable: {
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
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

vi.mock('@/drizzle/schema', () => ({
  TestTypeTable: {
    type_id: 'type_id',
    team_id: 'team_id',
    name: 'name',
  },
}));

describe('getTestTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns all test types ordered by name', async () => {
    vi.mocked(db.query.TestTypeTable.findMany).mockResolvedValue([
      MOCK_TEST_TYPE,
      MOCK_TEST_TYPE_2,
    ]);

    const result = await getTestTypes();

    expect(result).toEqual([MOCK_TEST_TYPE, MOCK_TEST_TYPE_2]);
    expect(db.query.TestTypeTable.findMany).toHaveBeenCalledWith({
      orderBy: [asc(TestTypeTable.name)],
    });
  });

  test('returns empty array when no test types exist', async () => {
    vi.mocked(db.query.TestTypeTable.findMany).mockResolvedValue([]);

    const result = await getTestTypes();

    expect(result).toEqual([]);
  });

  test('returns empty array when database query fails', async () => {
    vi.mocked(db.query.TestTypeTable.findMany).mockRejectedValue(
      new Error('Database error'),
    );

    const result = await getTestTypes();

    expect(result).toEqual([]);
  });
});

describe('getTestTypeById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns test type when found', async () => {
    vi.mocked(db.query.TestTypeTable.findFirst).mockResolvedValue(
      MOCK_TEST_TYPE,
    );

    const result = await getTestTypeById(MOCK_TEST_TYPE.type_id);

    expect(result).toEqual(MOCK_TEST_TYPE);
    expect(db.query.TestTypeTable.findFirst).toHaveBeenCalledWith({
      where: eq(TestTypeTable.type_id, MOCK_TEST_TYPE.type_id),
    });
  });

  test('returns undefined when test type not found', async () => {
    vi.mocked(db.query.TestTypeTable.findFirst).mockResolvedValue(undefined);

    const result = await getTestTypeById('unknown-id');

    expect(result).toBeUndefined();
  });

  test('returns null when database query fails', async () => {
    vi.mocked(db.query.TestTypeTable.findFirst).mockRejectedValue(
      new Error('Database error'),
    );

    const result = await getTestTypeById(MOCK_TEST_TYPE.type_id);

    expect(result).toBeNull();
  });
});

describe('insertTestType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts test type successfully', async () => {
    const mockValues = mockInsertSuccess(MOCK_TEST_TYPE);

    const result = await insertTestType(MOCK_TEST_TYPE_INPUT);

    expect(result).toEqual(MOCK_TEST_TYPE);
    expect(db.insert).toHaveBeenCalledWith(TestTypeTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_TEST_TYPE_INPUT);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(insertTestType({} as InsertTestType)).rejects.toThrow(message);
  });
});

describe('updateTestType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates test type successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess(MOCK_TEST_TYPE);
    const updateData: UpsertTestTypeSchemaValues = {
      name: 'Updated Sprint',
      unit: MOCK_TEST_TYPE.unit,
    };

    const result = await updateTestType(MOCK_TEST_TYPE.type_id, updateData);

    expect(result).toEqual(MOCK_TEST_TYPE);
    expect(db.update).toHaveBeenCalledWith(TestTypeTable);
    expect(mockSet).toHaveBeenCalledWith(updateData);
    expect(eq).toHaveBeenCalledWith(
      TestTypeTable.type_id,
      MOCK_TEST_TYPE.type_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: TestTypeTable.type_id,
      value: MOCK_TEST_TYPE.type_id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateTestType(MOCK_TEST_TYPE.type_id, {} as UpsertTestTypeSchemaValues),
    ).rejects.toThrow(message);
  });
});

describe('deleteTestType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes test type successfully', async () => {
    const mockWhere = mockDeleteSuccess(MOCK_TEST_TYPE);

    const result = await deleteTestType(MOCK_TEST_TYPE.type_id);

    expect(result).toEqual(MOCK_TEST_TYPE);
    expect(db.delete).toHaveBeenCalledWith(TestTypeTable);
    expect(eq).toHaveBeenCalledWith(
      TestTypeTable.type_id,
      MOCK_TEST_TYPE.type_id,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: TestTypeTable.type_id,
      value: MOCK_TEST_TYPE.type_id,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(deleteTestType(MOCK_TEST_TYPE.type_id)).rejects.toThrow(
      message,
    );
  });
});
