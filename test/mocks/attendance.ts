import { Attendance, InsertAttendance } from '@/drizzle/schema/attendance';

import { AttendanceStats, AttendanceWithPlayer } from '@/types/attendance';
import { DataWithStats } from '@/types/common';
import { AttendanceStatus } from '@/utils/enum';

import { MOCK_TEAM } from './team';
import { MOCK_PLAYER } from './user';

export const MOCK_ATTENDANCE_DATE = '2026-02-01';

export const MOCK_ATTENDANCE_INPUT: InsertAttendance = {
  player_id: MOCK_PLAYER.id,
  team_id: MOCK_TEAM.team_id,
  date: MOCK_ATTENDANCE_DATE,
  status: AttendanceStatus.ON_TIME,
  reason: null,
};

export const MOCK_ATTENDANCE_ON_TIME: Attendance = {
  attendance_id: 'attendance-1',
  player_id: 'player-123',
  team_id: MOCK_TEAM.team_id,
  date: MOCK_ATTENDANCE_DATE,
  status: AttendanceStatus.ON_TIME,
  reason: null,
  created_at: new Date('2026-02-01T08:00:00Z'),
  updated_at: new Date('2026-02-01T08:00:00Z'),
};

export const MOCK_ATTENDANCE_ABSENT: Attendance = {
  attendance_id: 'attendance-2',
  player_id: 'player-456',
  team_id: MOCK_TEAM.team_id,
  date: MOCK_ATTENDANCE_DATE,
  status: AttendanceStatus.ABSENT,
  reason: 'Family emergency',
  created_at: new Date('2026-02-02T08:00:00Z'),
  updated_at: new Date('2026-02-02T08:00:00Z'),
};

export const MOCK_ATTENDANCE_LATE: Attendance = {
  attendance_id: 'attendance-3',
  player_id: 'player-789',
  team_id: MOCK_TEAM.team_id,
  date: MOCK_ATTENDANCE_DATE,
  status: AttendanceStatus.LATE,
  reason: 'Traffic jam',
  created_at: new Date('2026-02-03T08:00:00Z'),
  updated_at: new Date('2026-02-03T08:00:00Z'),
};

export const MOCK_ATTENDANCE_BY_DATE: Array<AttendanceWithPlayer> = [
  {
    ...MOCK_ATTENDANCE_ON_TIME,
    player: {
      user: { name: 'A' },
    },
  },
  {
    ...MOCK_ATTENDANCE_LATE,
    player: {
      user: { name: 'B' },
    },
  },
  {
    ...MOCK_ATTENDANCE_ABSENT,
    player: {
      user: { name: 'C' },
    },
  },
];

export const MOCK_ATTENDANCE_STATS: AttendanceStats = {
  absent_count: 1,
  late_count: 1,
  on_time_count: 1,
  present_rate: 66.67,
};

export const MOCK_ATTENDANCE_RESPONSE: DataWithStats<
  AttendanceWithPlayer,
  AttendanceStats
> = {
  stats: MOCK_ATTENDANCE_STATS,
  data: MOCK_ATTENDANCE_BY_DATE,
};
