import { and, desc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { AttendanceTable, InsertAttendance } from '@/drizzle/schema/attendance';

import { AttendanceStats, AttendanceWithPlayer } from '@/types/attendance';
import { DataWithStats } from '@/types/common';
import { AttendanceStatus } from '@/utils/enum';

export async function getAttendanceByDate(
  team_id: string,
  date: string,
): Promise<DataWithStats<AttendanceWithPlayer, AttendanceStats>> {
  try {
    const records = await db.query.AttendanceTable.findMany({
      where: and(
        eq(AttendanceTable.team_id, team_id),
        eq(AttendanceTable.date, date),
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

    // Calculate statistics
    const total_records = records.length;
    const on_time_count = records.filter(
      ({ status }) => status === AttendanceStatus.ON_TIME,
    ).length;
    const late_count = records.filter(
      ({ status }) => status === AttendanceStatus.LATE,
    ).length;
    const absent_count = total_records - on_time_count - late_count;
    const present_rate = total_records
      ? ((on_time_count + late_count) / total_records) * 100
      : 0;

    return {
      data: records,
      stats: {
        on_time_count,
        late_count,
        absent_count,
        present_rate: parseFloat(present_rate.toFixed(2)),
      },
    };
  } catch {
    return {
      data: [],
      stats: {
        on_time_count: 0,
        late_count: 0,
        absent_count: 0,
        present_rate: 0,
      },
    };
  }
}

export async function insertAttendance(attendance: InsertAttendance) {
  return await db.insert(AttendanceTable).values(attendance);
}

export async function updateAttendance(
  attendance_id: string,
  attendance: Partial<InsertAttendance>,
) {
  return await db
    .update(AttendanceTable)
    .set(attendance)
    .where(eq(AttendanceTable.attendance_id, attendance_id));
}

export async function deleteAttendance(attendance_id: string) {
  return await db
    .delete(AttendanceTable)
    .where(eq(AttendanceTable.attendance_id, attendance_id));
}
