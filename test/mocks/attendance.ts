import { Attendance, InsertAttendance } from '@/drizzle/schema/attendance';
import { AttendanceStats } from '@/types/attendance';
import { AttendanceStatus } from '@/utils/enum';

import { MOCK_TEAM } from './team';
import { MOCK_PLAYER } from './user';

export const MOCK_ATTENDANCE_INPUT: InsertAttendance = {
  player_id: MOCK_PLAYER.id,
  team_id: MOCK_TEAM.team_id,
  date: '2026-02-01',
  status: AttendanceStatus.ON_TIME,
  reason: null,
};

export const MOCK_ATTENDANCE_ON_TIME: Attendance = {
  attendance_id: 'attendance-1',
  player_id: 'player-123',
  team_id: MOCK_TEAM.team_id,
  date: '2026-02-01',
  status: AttendanceStatus.ON_TIME,
  reason: null,
  created_at: new Date('2026-02-01T08:00:00Z'),
  updated_at: new Date('2026-02-01T08:00:00Z'),
};

export const MOCK_ATTENDANCE_ABSENT: Attendance = {
  attendance_id: 'attendance-2',
  player_id: 'player-123',
  team_id: MOCK_TEAM.team_id,
  date: '2026-02-02',
  status: AttendanceStatus.ABSENT,
  reason: 'Family emergency',
  created_at: new Date('2026-02-02T08:00:00Z'),
  updated_at: new Date('2026-02-02T08:00:00Z'),
};

export const MOCK_ATTENDANCE_LATE: Attendance = {
  attendance_id: 'attendance-3',
  player_id: 'player-456',
  team_id: MOCK_TEAM.team_id,
  date: '2026-02-03',
  status: AttendanceStatus.LATE,
  reason: 'Traffic jam',
  created_at: new Date('2026-02-03T08:00:00Z'),
  updated_at: new Date('2026-02-03T08:00:00Z'),
};

// Multiple attendance records for testing
export const MOCK_ATTENDANCE_RECORDS: Array<Attendance> = [
  MOCK_ATTENDANCE_ON_TIME,
  MOCK_ATTENDANCE_ABSENT,
  MOCK_ATTENDANCE_LATE,
  {
    attendance_id: 'attendance-5',
    player_id: 'player-123',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-05',
    status: AttendanceStatus.ON_TIME,

    reason: null,
    created_at: new Date('2026-02-05T08:00:00Z'),
    updated_at: new Date('2026-02-05T08:00:00Z'),
  },
  {
    attendance_id: 'attendance-6',
    player_id: 'player-456',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-05',
    status: AttendanceStatus.ON_TIME,

    reason: null,
    created_at: new Date('2026-02-05T08:00:00Z'),
    updated_at: new Date('2026-02-05T08:00:00Z'),
  },
  {
    attendance_id: 'attendance-7',
    player_id: 'player-789',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-05',
    status: AttendanceStatus.ABSENT,
    reason: 'Sick leave',
    created_at: new Date('2026-02-05T08:00:00Z'),
    updated_at: new Date('2026-02-05T08:00:00Z'),
  },
  {
    attendance_id: 'attendance-8',
    player_id: 'player-123',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-06',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-06T08:00:00Z'),
    updated_at: new Date('2026-02-06T08:00:00Z'),
  },
];

// Attendance with player relationships (for db queries with 'with')
export const MOCK_ATTENDANCE_WITH_PLAYER = {
  ...MOCK_ATTENDANCE_ON_TIME,
  player: {
    user: {
      name: 'Dios Vo',
    },
  },
};

export const MOCK_ATTENDANCE_STATS: AttendanceStats = {
  on_time_count: 5,
  absent_count: 2,
  late_count: 1,
  present_rate: 87.5,
};
