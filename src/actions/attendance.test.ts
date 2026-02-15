import { vi } from 'vitest';

import { revalidate } from '@/actions/cache';
import {
  deleteAttendance,
  getAttendanceByDate as fetchAttendance,
  insertAttendance,
  updateAttendance,
} from '@/db/attendance';
import { getDbErrorMessage } from '@/db/pg-error';

import {
  MOCK_ATTENDANCE_DATE,
  MOCK_ATTENDANCE_INPUT,
  MOCK_ATTENDANCE_ON_TIME,
  MOCK_ATTENDANCE_RESPONSE,
} from '@/test/mocks/attendance';
import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';

import { AttendanceStatus } from '@/utils/enum';

import {
  getAttendanceByDate,
  removeAttendance,
  submitLeave,
  updateStatus,
} from './attendance';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/attendance', () => ({
  getAttendanceByDate: vi.fn(),
  insertAttendance: vi.fn(),
  updateAttendance: vi.fn(),
  deleteAttendance: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    attendances: vi.fn(),
  },
}));

const MOCK_ATTENDANCE_ID = MOCK_ATTENDANCE_ON_TIME.attendance_id;

describe('Attendance Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResult = {
    rows: [],
    rowCount: 1,
    oid: 0,
    fields: [],
  };

  describe('getAttendanceByDate', () => {
    test('calls fetchAttendance with team_id and date', async () => {
      vi.mocked(fetchAttendance).mockResolvedValue(MOCK_ATTENDANCE_RESPONSE);

      const result = await getAttendanceByDate(MOCK_ATTENDANCE_DATE);

      expect(fetchAttendance).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        MOCK_ATTENDANCE_DATE,
      );
      expect(result).toEqual(MOCK_ATTENDANCE_RESPONSE);
    });

    test('propagates errors from fetchAttendance', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(fetchAttendance).mockRejectedValue(error);

      await expect(getAttendanceByDate(MOCK_ATTENDANCE_DATE)).rejects.toThrow(
        message,
      );
    });
  });

  describe('submitLeave', () => {
    const leaveData = {
      player_id: MOCK_ATTENDANCE_INPUT.player_id,
      date: MOCK_ATTENDANCE_INPUT.date,
      status: MOCK_ATTENDANCE_INPUT.status,
      reason: MOCK_ATTENDANCE_INPUT.reason,
    };

    test('submits leave successfully and revalidates cache', async () => {
      vi.mocked(insertAttendance).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await submitLeave(leaveData);

      expect(insertAttendance).toHaveBeenCalledWith({
        ...leaveData,
        team_id: MOCK_TEAM.team_id,
      });
      expect(revalidate.attendances).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Leave request submitted successfully',
      });
    });

    test('returns error when player_id constraint is violated', async () => {
      const errorMessage = 'Invalid or missing player ID';
      vi.mocked(insertAttendance).mockRejectedValue(new Error('FK violation'));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Foreign key violation',
        constraint: 'attendance_player_id_player_id_fk',
      });

      const result = await submitLeave(leaveData);

      expect(revalidate.attendances).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('returns error when unique_player_per_date constraint is violated', async () => {
      vi.mocked(insertAttendance).mockRejectedValue(
        new Error('Unique constraint'),
      );
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: 'Duplicate entry',
        constraint: 'unique_player_per_date',
      });

      const result = await submitLeave(leaveData);

      const shortId = leaveData.player_id.slice(0, 8);
      expect(revalidate.attendances).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: `${shortId}: Already submitted`,
      });
    });

    test('returns generic error message for other database errors', async () => {
      const errorMessage = 'Database connection failed';
      vi.mocked(insertAttendance).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await submitLeave(leaveData);

      expect(revalidate.attendances).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles non-error exceptions', async () => {
      const errorMessage = 'Unknown error';
      vi.mocked(insertAttendance).mockRejectedValue('Unknown error');
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await submitLeave(leaveData);

      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe('updateStatus', () => {
    const newStatus = AttendanceStatus.LATE;

    test('updates attendance status successfully and revalidates cache', async () => {
      vi.mocked(updateAttendance).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await updateStatus(MOCK_ATTENDANCE_ID, newStatus);

      expect(updateAttendance).toHaveBeenCalledWith(MOCK_ATTENDANCE_ID, {
        status: newStatus,
      });
      expect(revalidate.attendances).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated attendance status successfully',
      });
    });

    test('returns error response when update fails', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(updateAttendance).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await updateStatus(MOCK_ATTENDANCE_ID, newStatus);

      const shortId = MOCK_ATTENDANCE_ID.slice(0, 8);
      expect(revalidate.attendances).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: `${errorMessage} (id: ${shortId})`,
      });
    });

    test('handles non-error exceptions', async () => {
      const errorMessage = 'Unknown error';
      vi.mocked(updateAttendance).mockRejectedValue('Unknown error');
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await updateStatus(MOCK_ATTENDANCE_ID, newStatus);

      const shortId = MOCK_ATTENDANCE_ID.slice(0, 8);
      expect(result).toEqual({
        success: false,
        message: `${errorMessage} (id: ${shortId})`,
      });
    });
  });

  describe('removeAttendance', () => {
    test('deletes attendance successfully and revalidates cache', async () => {
      vi.mocked(deleteAttendance).mockResolvedValue({
        ...mockResult,
        command: 'DELETE',
      });

      const result = await removeAttendance(MOCK_ATTENDANCE_ID);

      expect(deleteAttendance).toHaveBeenCalledWith(MOCK_ATTENDANCE_ID);
      expect(revalidate.attendances).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Deleted attendance record successfully',
      });
    });

    test('returns error response when delete fails', async () => {
      const errorMessage = 'Delete failed';
      vi.mocked(deleteAttendance).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await removeAttendance(MOCK_ATTENDANCE_ID);

      const shortId = MOCK_ATTENDANCE_ID.slice(0, 8);
      expect(deleteAttendance).toHaveBeenCalledWith(MOCK_ATTENDANCE_ID);
      expect(revalidate.attendances).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: `${errorMessage} (id: ${shortId})`,
      });
    });

    test('handles database constraint errors', async () => {
      const errorMessage = 'Foreign key constraint violation';
      vi.mocked(deleteAttendance).mockRejectedValue({
        code: '23503',
        detail: 'FK error',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: 'fk_constraint',
      });

      const result = await removeAttendance(MOCK_ATTENDANCE_ID);

      const shortId = MOCK_ATTENDANCE_ID.slice(0, 8);
      expect(result).toEqual({
        success: false,
        message: `${errorMessage} (id: ${shortId})`,
      });
    });

    test('handles non-error exceptions', async () => {
      const errorMessage = 'Unknown error';
      vi.mocked(deleteAttendance).mockRejectedValue('Unknown error');
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await removeAttendance(MOCK_ATTENDANCE_ID);

      const shortId = MOCK_ATTENDANCE_ID.slice(0, 8);
      expect(result).toEqual({
        success: false,
        message: `${errorMessage} (id: ${shortId})`,
      });
    });
  });
});
