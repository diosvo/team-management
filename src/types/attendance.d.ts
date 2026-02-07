import { StatCard } from '@/components/Stats';

import { Attendance } from '@/drizzle/schema/attendance';
import { User } from '@/drizzle/schema/user';

export interface AttendanceWithPlayer extends Attendance {
  player: {
    user: Pick<User, 'name'>;
  };
}

export type AttendanceStats = StatCard['data'] & {
  on_time_count: number;
  late_count: number;
  absent_count: number;
  present_rate: number;
};
