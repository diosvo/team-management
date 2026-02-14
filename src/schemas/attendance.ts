import { SELECTABLE_ATTENDANCE_STATUS } from '@/utils/constant';
import { AttendanceStatus } from '@/utils/enum';
import { z } from 'zod';

export const UpsertAttendanceSchema = z.object({
  player_id: z.string().default(''),
  date: z.iso.date(),
  status: z.enum(SELECTABLE_ATTENDANCE_STATUS).default(AttendanceStatus.ABSENT),
  reason: z
    .string()
    .max(128, { error: 'Be at most 128 characters long.' })
    .nullable(),
});

export const BulkAttendanceSchema = z.object({
  date: z.string(),
  attendances: z.array(
    z.object({
      player_id: z.string(),
      status: z
        .enum(SELECTABLE_ATTENDANCE_STATUS)
        .default(AttendanceStatus.ABSENT),
      reason: z.string().max(128).optional(),
    }),
  ),
});

export type UpsertAttendanceSchemaValues = z.infer<
  typeof UpsertAttendanceSchema
>;
export type BulkAttendanceSchemaValues = z.input<typeof BulkAttendanceSchema>;
