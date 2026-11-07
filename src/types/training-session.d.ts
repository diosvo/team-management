import type { Attendance, Coach } from '@/drizzle/schema';
import type { Location } from '@/drizzle/schema/location';
import type { TrainingSession } from '@/drizzle/schema/training';

export interface TrainingSessionWithDetails extends TrainingSession {
  location: Pick<Location, 'name'> | null;
  coach: Pick<Coach, 'id'> | null;
  attendances: Array<Pick<Attendance, 'attendance_id' | 'status'>>;
  analytics: {
    late: number;
    on_time: number;
    present_rate: number;
  };
}

export interface TrainingSessionStats {
  completed_sessions: number;
  avg_attendance: number;
  total_hours: number;
}
