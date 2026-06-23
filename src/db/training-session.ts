import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';

import { AttendanceStatus, SessionStatus } from '@/utils/enum';
import { TrainingSearchParams } from '@/lib/nuqs';
import { TIME_DURATION } from '@/utils/formatter';

import db from '@/drizzle';
import { InsertTrainingSession, TrainingSessionTable } from '@/drizzle/schema';

import { DataWithStats } from '@/types/common';
import {
  TrainingSessionStats,
  TrainingSessionWithDetails,
} from '@/types/training-session';

export async function getSessions(
  team_id: string,
  params: TrainingSearchParams,
): Promise<DataWithStats<TrainingSessionWithDetails, TrainingSessionStats>> {
  const { interval } = params;
  const { start, end } = TIME_DURATION[interval];

  try {
    const conditions = [
      eq(TrainingSessionTable.team_id, team_id),
      gte(TrainingSessionTable.date, start.toISOString()),
      lte(TrainingSessionTable.date, end.toISOString()),
    ];

    if (params.status.length > 0) {
      conditions.push(inArray(TrainingSessionTable.status, params.status));
    }

    const result = await db.query.TrainingSessionTable.findMany({
      where: and(...conditions),
      with: {
        location: {
          columns: { name: true },
        },
        coach: {
          columns: { id: true },
        },
        attendances: {
          columns: { attendance_id: true, status: true },
        },
      },
      orderBy: [
        desc(TrainingSessionTable.date),
        desc(TrainingSessionTable.start_time),
      ],
    });

    const data = result.map((session) => {
      const on_time = session.attendances.filter(
        ({ status }) => status === AttendanceStatus.ON_TIME,
      ).length;
      const late = session.attendances.filter(
        ({ status }) => status === AttendanceStatus.LATE,
      ).length;
      const total_attendances = session.attendances.length;
      const present_rate =
        total_attendances > 0
          ? Number((((on_time + late) / total_attendances) * 100).toFixed(1))
          : 0;

      return {
        ...session,
        attendance_count: total_attendances,
        analytics: { on_time, late, present_rate },
      };
    });

    const completed_sessions = result.filter(
      ({ status }) => status === SessionStatus.COMPLETED,
    ).length;
    const avg_attendance =
      data.length > 0
        ? data.reduce((acc, session) => acc + session.attendance_count, 0) /
          data.length
        : 0;
    const total_hours = data.reduce((acc, session) => {
      const start = new Date(`1970-01-01T${session.start_time}Z`);
      const end = new Date(`1970-01-01T${session.end_time}Z`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return acc + hours;
    }, 0);

    return {
      data,
      stats: {
        completed_sessions,
        avg_attendance,
        total_hours,
      },
    };
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return {
      data: [],
      stats: {
        completed_sessions: 0,
        avg_attendance: 0,
        total_hours: 0,
      },
    };
  }
}

export async function insertSession(values: InsertTrainingSession) {
  return db.insert(TrainingSessionTable).values(values).returning();
}

export async function updateSession(
  session_id: string,
  values: Partial<InsertTrainingSession>,
) {
  return db
    .update(TrainingSessionTable)
    .set(values)
    .where(eq(TrainingSessionTable.session_id, session_id))
    .returning();
}

export async function deleteSession(session_id: string) {
  return db
    .delete(TrainingSessionTable)
    .where(eq(TrainingSessionTable.session_id, session_id))
    .returning();
}
