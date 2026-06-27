import { AttendanceStatus } from '@/utils/enum';

import { Attendance } from '@/drizzle/schema/attendance';
import { User } from '@/drizzle/schema/user';

export type AttendanceStatusValues = keyof typeof AttendanceStatus;

export interface AttendanceWithPlayer extends Attendance {
  player: {
    user: Pick<User, 'name'>;
  };
}

export interface AttendanceStats {
  on_time_count: number;
  late_count: number;
  absent_count: number;
  present_rate: number;
}
