import db from '@/drizzle';
import { CoachTable } from '@/drizzle/schema/coach';

import { mockInsertFailure, mockInsertSuccess } from '@/test/db-operations';
import { MOCK_COACH } from '@/test/mocks/user';

import { insertCoach } from './coach';

vi.mock('@/drizzle', () => ({
  default: {
    insert: vi.fn(() => ({
      values: vi.fn(),
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
