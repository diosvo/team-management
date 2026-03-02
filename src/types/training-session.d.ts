import { StatCard } from '@/components/Stats';
import { SessionStatus } from '@/utils/enum';

import { Attendance, Coach } from '@/drizzle/schema';
import { Location } from '@/drizzle/schema/location';
import { TrainingSession } from '@/drizzle/schema/training';

export type SessionStatusValues = keyof typeof SessionStatus;

export interface TrainingSessionWithDetails extends TrainingSession {
  location: Pick<Location, 'name'> | null;
  coach: Pick<Coach, 'id'> | null;
  attendances: Array<Pick<Attendance, 'attendance_id' | 'status'>>;
  present_rate: string;
}

export type TrainingSessionStats = StatCard['data'] & {
  completed_sessions: number;
  avg_attendance: number;
  total_hours: number;
};
