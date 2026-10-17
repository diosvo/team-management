'use server';

import { getTranslations } from 'next-intl/server';
import { forbidden } from 'next/navigation';

import { AttendanceStatus } from '@/utils/enum';
import { hasPermissions } from '@/utils/permissions';
import { ResponseFactory } from '@/utils/response';

import {
  deleteAttendance,
  getAttendances as fetchAttendances,
  insertAttendance,
  updateAttendance,
} from '@/db/attendance';
import { getDbErrorMessage } from '@/db/pg-error';
import type { InsertAttendance } from '@/drizzle/schema';
import type { DateRange } from '@/types/common';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const attendance = withResource('attendance');

export const getAttendances = withAuth(
  async ({ team_id }, range: DateRange) =>
    await fetchAttendances(team_id, range),
);

export const submitLeave = attendance(
  ['create'],
  async function submit(user, values: InsertAttendance) {
    // Players may only submit leave for themselves
    const { isPlayer } = hasPermissions(user.role);
    if (isPlayer && values.player_id !== user.id) forbidden();

    const t = await getTranslations('actions.attendance');

    try {
      await insertAttendance(values);

      revalidate.attendances();

      return ResponseFactory.success(t('leaveSubmitted'));
    } catch (error) {
      const { message, constraint } = getDbErrorMessage(error);
      if (constraint === 'attendance_player_id_player_id_fk') {
        return ResponseFactory.error(t('invalidPlayer'));
      }

      // Session-less records collide per date, session-linked ones per session.
      if (
        constraint === 'unique_player_per_date' ||
        constraint === 'unique_player_per_session'
      ) {
        const shortId = values.player_id.slice(0, 8);
        return ResponseFactory.error(t('alreadySubmitted', { id: shortId }));
      }

      return ResponseFactory.error(message);
    }
  },
);

export const updateStatus = attendance(
  ['edit'],
  async function update(_, attendance_id: string, status: AttendanceStatus) {
    const t = await getTranslations('actions.attendance');
    try {
      await updateAttendance(attendance_id, {
        status,
      });

      revalidate.attendances();

      return ResponseFactory.success(t('statusUpdated'));
    } catch (error) {
      const shortId = attendance_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(`${message} (id: ${shortId})`);
    }
  },
);

export const removeAttendance = attendance(
  ['delete'],
  async function remove(_, attendance_id: string) {
    const t = await getTranslations('actions.attendance');
    try {
      await deleteAttendance(attendance_id);

      revalidate.attendances();

      return ResponseFactory.success(t('deleted'));
    } catch (error) {
      const shortId = attendance_id.slice(0, 8);
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(`${message} (id: ${shortId})`);
    }
  },
);
