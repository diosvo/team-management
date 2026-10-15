import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { CoachTable, type InsertCoach } from '@/drizzle/schema/coach';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockUpsertFailure,
  mockUpsertSuccess,
} from '@/test/db-operations';
import { MOCK_COACH } from '@/test/mocks/user';

import { CoachPosition } from '@/utils/enum';
import { deleteCoach, insertCoach, upsertCoach } from './coach';

vi.mock('@/drizzle', () => ({
  default: {
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

vi.mock('@/drizzle/schema/coach', () => ({
  CoachTable: {
    id: 'coach-123',
  },
}));

describe('insertCoach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts coach successfully', async () => {
    const mockValues = mockInsertSuccess({ id: MOCK_COACH.id });

    const result = await insertCoach(MOCK_COACH);

    expect(result).toEqual({ id: MOCK_COACH.id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(CoachTable);
    expect(mockValues).toHaveBeenCalledWith(MOCK_COACH);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(insertCoach(MOCK_COACH)).rejects.toThrow(message);
  });
});

describe('upsertCoach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts the coach, updating the existing row on conflict', async () => {
    const updatedCoach: InsertCoach = {
      ...MOCK_COACH,
      position: CoachPosition.ASSISTANT_COACH,
    };
    const { mockValues, mockOnConflictDoUpdate } = mockUpsertSuccess({
      id: MOCK_COACH.id,
    });

    const result = await upsertCoach(updatedCoach);

    expect(result).toEqual({ id: MOCK_COACH.id });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(CoachTable);
    expect(mockValues).toHaveBeenCalledWith(updatedCoach);
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: CoachTable.id,
      set: updatedCoach,
    });
  });

  test('throws error when upsert fails', async () => {
    const message = 'Upsert failed';
    mockUpsertFailure(message);

    await expect(upsertCoach(MOCK_COACH)).rejects.toThrow(message);
  });
});

describe('deleteCoach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes coach successfully', async () => {
    const mockWhere = mockDeleteSuccess({ rowCount: 1 });

    const result = await deleteCoach(MOCK_COACH.id);

    expect(result).toEqual({ rowCount: 1 });
    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(CoachTable);
    expect(eq).toHaveBeenCalledWith(CoachTable.id, MOCK_COACH.id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: CoachTable.id,
      value: MOCK_COACH.id,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(deleteCoach(MOCK_COACH.id)).rejects.toThrow(message);
  });
});
