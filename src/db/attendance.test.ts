import { and, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { AttendanceTable, InsertAttendance } from '@/drizzle/schema/attendance';

import {
  mockDeleteFailure,
  mockDeleteSuccess,
  mockInsertFailure,
  mockInsertSuccess,
  mockUpdateFailure,
  mockUpdateSuccess,
} from '@/test/db-operations';
import {
  MOCK_ATTENDANCE_BY_DATE,
  MOCK_ATTENDANCE_DATE,
  MOCK_ATTENDANCE_INPUT,
  MOCK_ATTENDANCE_ON_TIME,
  MOCK_ATTENDANCE_RESPONSE,
} from '@/test/mocks/attendance';
import { MOCK_TEAM } from '@/test/mocks/team';

import {
  deleteAttendance,
  getAttendanceByDate,
  insertAttendance,
  updateAttendance,
} from './attendance';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      AttendanceTable: {
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

vi.mock('@/drizzle/schema/attendance', () => ({
  AttendanceTable: {
    team_id: 'team_id',
    attendance_id: 'attendance_id',
    date: 'date',
    status: 'status',
  },
}));

const MOCK_ATTENDANCE_ID = MOCK_ATTENDANCE_ON_TIME.attendance_id;

describe('getAttendanceByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns attendance records with stats when database query succeeds', async () => {
    vi.mocked(db.query.AttendanceTable.findMany).mockResolvedValue(
      MOCK_ATTENDANCE_BY_DATE,
    );

    const result = await getAttendanceByDate(
      MOCK_TEAM.team_id,
      MOCK_ATTENDANCE_DATE,
    );

    expect(result).toEqual(MOCK_ATTENDANCE_RESPONSE);
    // Verify query construction
    expect(db.query.AttendanceTable.findMany).toHaveBeenCalledWith({
      where: and(
        eq(AttendanceTable.team_id, MOCK_TEAM.team_id),
        eq(AttendanceTable.date, MOCK_ATTENDANCE_DATE),
      ),
      with: {
        player: {
          columns: {},
          with: {
            user: {
              columns: { name: true },
            },
          },
        },
      },
      orderBy: desc(AttendanceTable.status),
    });
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exceptions',
      mockError: 'Unknown error',
    },
  ])(
    'returns default stats when database query $description',
    async ({ mockError }) => {
      vi.mocked(db.query.AttendanceTable.findMany).mockRejectedValue(mockError);

      const result = await getAttendanceByDate(
        MOCK_TEAM.team_id,
        MOCK_ATTENDANCE_DATE,
      );

      expect(result).toEqual({
        stats: {
          on_time_count: 0,
          late_count: 0,
          absent_count: 0,
          present_rate: 0,
        },
        data: [],
      });
    },
  );
});

describe('insertAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInsertData: InsertAttendance = MOCK_ATTENDANCE_INPUT;

  test('inserts attendance successfully', async () => {
    const mockValues = mockInsertSuccess({
      attendance_id: MOCK_ATTENDANCE_ON_TIME.attendance_id,
    });

    const result = await insertAttendance(mockInsertData);

    expect(result).toEqual({
      attendance_id: MOCK_ATTENDANCE_ON_TIME.attendance_id,
    });

    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(AttendanceTable);
    expect(mockValues).toHaveBeenCalledWith(mockInsertData);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    mockInsertFailure(message);

    await expect(insertAttendance(mockInsertData)).rejects.toThrow(message);
  });
});

describe('updateAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const updatedAttendance: Partial<InsertAttendance> = {
    status: MOCK_ATTENDANCE_INPUT.status,
    reason: 'Updated reason',
  };

  test('updates attendance successfully', async () => {
    const { mockWhere, mockSet } = mockUpdateSuccess({
      attendance_id: MOCK_ATTENDANCE_ID,
    });

    const result = await updateAttendance(
      MOCK_ATTENDANCE_ID,
      updatedAttendance,
    );

    expect(result).toEqual({
      attendance_id: MOCK_ATTENDANCE_ID,
    });

    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(AttendanceTable);
    expect(mockSet).toHaveBeenCalledWith(updatedAttendance);
    expect(eq).toHaveBeenCalledWith(
      AttendanceTable.attendance_id,
      MOCK_ATTENDANCE_ID,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: AttendanceTable.attendance_id,
      value: MOCK_ATTENDANCE_ID,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(
      updateAttendance(MOCK_ATTENDANCE_ID, updatedAttendance),
    ).rejects.toThrow(message);
  });
});

describe('deleteAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes attendance successfully', async () => {
    const mockWhere = mockDeleteSuccess({
      attendance_id: MOCK_ATTENDANCE_ID,
    });

    const result = await deleteAttendance(MOCK_ATTENDANCE_ID);

    expect(result).toEqual({
      attendance_id: MOCK_ATTENDANCE_ID,
    });

    // Verify query construction
    expect(db.delete).toHaveBeenCalledWith(AttendanceTable);
    expect(eq).toHaveBeenCalledWith(
      AttendanceTable.attendance_id,
      MOCK_ATTENDANCE_ID,
    );
    expect(mockWhere).toHaveBeenCalledWith({
      field: AttendanceTable.attendance_id,
      value: MOCK_ATTENDANCE_ID,
      type: 'eq',
    });
  });

  test('throws error when delete fails', async () => {
    const message = 'Delete failed';
    mockDeleteFailure(message);

    await expect(deleteAttendance(MOCK_ATTENDANCE_ID)).rejects.toThrow(message);
  });
});
