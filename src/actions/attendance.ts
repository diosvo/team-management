'use server';

import { AttendanceStatus } from '@/utils/enum';
import { ResponseFactory } from '@/utils/response';

import {
  deleteAttendance,
  getAttendanceByDate as fetchAttendance,
  insertAttendance,
  updateAttendance,
} from '@/db/attendance';
import { getDbErrorMessage } from '@/db/pg-error';
import { InsertAttendance } from '@/drizzle/schema';

import { withAuth } from './auth';
import { revalidate } from './cache';

export const getAttendanceByDate = withAuth(
  async ({ team_id }, date: string) => await fetchAttendance(team_id, date),
);

export const submitLeave = withAuth(
  async ({ team_id }, values: Omit<InsertAttendance, 'team_id'>) => {
    try {
      await insertAttendance({
        ...values,
        team_id,
      });

      revalidate.attendances();

      return ResponseFactory.success('Leave request submitted successfully');
    } catch (error) {
      const { message, constraint } = getDbErrorMessage(error);
      if (constraint === 'attendance_player_id_player_id_fk') {
        return ResponseFactory.error('Invalid or missing player ID');
      }

      if (constraint === 'unique_player_per_date') {
        const shortId = values.player_id.slice(0, 8);
        return ResponseFactory.error(`${shortId}: Already submitted`);
      }

      return ResponseFactory.error(message);
    }
  },
);

export const updateStatus = withAuth(
  async (_, attendance_id: string, status: AttendanceStatus) => {
    try {
      await updateAttendance(attendance_id, {
        status,
      });

      revalidate.attendances();

      return ResponseFactory.success('Updated attendance status successfully');
    } catch (error) {
      const shortId = attendance_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(`${message} (id: ${shortId})`);
    }
  },
);

export const removeAttendance = withAuth(async (_, attendance_id: string) => {
  try {
    await deleteAttendance(attendance_id);

    revalidate.attendances();

    return ResponseFactory.success('Deleted attendance record successfully');
  } catch (error) {
    const shortId = attendance_id.slice(0, 8);
    const { message } = getDbErrorMessage(error);
    return ResponseFactory.error(`${message} (id: ${shortId})`);
  }
});
