import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { CoachTable, InsertCoach } from '@/drizzle/schema/coach';

import {
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import { MOCK_COACH } from '@/test/mocks/user';

import { CoachPosition } from '@/utils/enum';
import { insertCoach, updateCoach } from './coach';

vi.mock('@/drizzle', () => ({
  default: {
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

describe('updateCoach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates coach successfully', async () => {
    const updatedCoach: InsertCoach = {
      ...MOCK_COACH,
      position: CoachPosition.ASSISTANT_COACH,
    };
    const { mockWhere, mockSet } = mockUpdateSuccess({ id: MOCK_COACH.id });

    const result = await updateCoach(updatedCoach);

    expect(result).toEqual({ id: MOCK_COACH.id });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(CoachTable);
    expect(mockSet).toHaveBeenCalledWith(updatedCoach);
    expect(eq).toHaveBeenCalledWith(CoachTable.id, updatedCoach.id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: CoachTable.id,
      value: updatedCoach.id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(updateCoach(MOCK_COACH)).rejects.toThrow(message);
  });
});
