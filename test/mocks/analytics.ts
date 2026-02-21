import { AttendanceWithPlayer } from '@/types/attendance';
import { AttendanceStatus } from '@/utils/enum';

import {
  AbsenceReason,
  AttendanceHistoryRecord,
  PlayerSessionSummary,
  PlayerStats,
} from '@/types/analytics';
import { MOCK_LOCATION } from './location';
import { MOCK_TEAM } from './team';

export const MOCK_TRAINING_HISTORY: Array<AttendanceWithPlayer> = [
  // Feb 15, 2026 (Great attendance)
  {
    attendance_id: 'att-001',
    player_id: 'player-001',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-15',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-15T18:00:00Z'),
    updated_at: new Date('2026-02-15T18:00:00Z'),
    player: { user: { name: 'John Smith' } },
  },
  {
    attendance_id: 'att-002',
    player_id: 'player-002',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-15',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-15T18:00:00Z'),
    updated_at: new Date('2026-02-15T18:00:00Z'),
    player: { user: { name: 'Sarah Johnson' } },
  },
  {
    attendance_id: 'att-003',
    player_id: 'player-003',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-15',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-15T18:00:00Z'),
    updated_at: new Date('2026-02-15T18:00:00Z'),
    player: { user: { name: 'Mike Davis' } },
  },
  {
    attendance_id: 'att-004',
    player_id: 'player-004',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-15',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-15T18:00:00Z'),
    updated_at: new Date('2026-02-15T18:00:00Z'),
    player: { user: { name: 'Lisa Chen' } },
  },
  {
    attendance_id: 'att-005',
    player_id: 'player-005',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-15',
    status: AttendanceStatus.LATE,
    reason: 'Traffic',
    created_at: new Date('2026-02-15T18:15:00Z'),
    updated_at: new Date('2026-02-15T18:15:00Z'),
    player: { user: { name: 'Tom Wilson' } },
  },
  {
    attendance_id: 'att-006',
    player_id: 'player-006',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-15',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-15T18:00:00Z'),
    updated_at: new Date('2026-02-15T18:00:00Z'),
    player: { user: { name: 'Emma Brown' } },
  },

  // Feb 13, 2026 (Good attendance)
  {
    attendance_id: 'att-007',
    player_id: 'player-001',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-13',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-13T18:00:00Z'),
    updated_at: new Date('2026-02-13T18:00:00Z'),
    player: { user: { name: 'John Smith' } },
  },
  {
    attendance_id: 'att-008',
    player_id: 'player-002',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-13',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-13T18:00:00Z'),
    updated_at: new Date('2026-02-13T18:00:00Z'),
    player: { user: { name: 'Sarah Johnson' } },
  },
  {
    attendance_id: 'att-009',
    player_id: 'player-003',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-13',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-13T18:00:00Z'),
    updated_at: new Date('2026-02-13T18:00:00Z'),
    player: { user: { name: 'Mike Davis' } },
  },
  {
    attendance_id: 'att-010',
    player_id: 'player-004',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-13',
    status: AttendanceStatus.LATE,
    reason: 'Meeting ran late',
    created_at: new Date('2026-02-13T18:10:00Z'),
    updated_at: new Date('2026-02-13T18:10:00Z'),
    player: { user: { name: 'Lisa Chen' } },
  },
  {
    attendance_id: 'att-011',
    player_id: 'player-005',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-13',
    status: AttendanceStatus.ABSENT,
    reason: 'Sick',
    created_at: new Date('2026-02-13T18:00:00Z'),
    updated_at: new Date('2026-02-13T18:00:00Z'),
    player: { user: { name: 'Tom Wilson' } },
  },
  {
    attendance_id: 'att-012',
    player_id: 'player-006',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-13',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-13T18:00:00Z'),
    updated_at: new Date('2026-02-13T18:00:00Z'),
    player: { user: { name: 'Emma Brown' } },
  },

  // Feb 11, 2026 (Moderate attendance)
  {
    attendance_id: 'att-013',
    player_id: 'player-001',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-11',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-11T18:00:00Z'),
    updated_at: new Date('2026-02-11T18:00:00Z'),
    player: { user: { name: 'John Smith' } },
  },
  {
    attendance_id: 'att-014',
    player_id: 'player-002',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-11',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-11T18:00:00Z'),
    updated_at: new Date('2026-02-11T18:00:00Z'),
    player: { user: { name: 'Sarah Johnson' } },
  },
  {
    attendance_id: 'att-015',
    player_id: 'player-003',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-11',
    status: AttendanceStatus.LATE,
    reason: 'Car trouble',
    created_at: new Date('2026-02-11T18:20:00Z'),
    updated_at: new Date('2026-02-11T18:20:00Z'),
    player: { user: { name: 'Mike Davis' } },
  },
  {
    attendance_id: 'att-016',
    player_id: 'player-004',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-11',
    status: AttendanceStatus.ABSENT,
    reason: 'Family emergency',
    created_at: new Date('2026-02-11T18:00:00Z'),
    updated_at: new Date('2026-02-11T18:00:00Z'),
    player: { user: { name: 'Lisa Chen' } },
  },
  {
    attendance_id: 'att-017',
    player_id: 'player-005',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-11',
    status: AttendanceStatus.ABSENT,
    reason: 'Work',
    created_at: new Date('2026-02-11T18:00:00Z'),
    updated_at: new Date('2026-02-11T18:00:00Z'),
    player: { user: { name: 'Tom Wilson' } },
  },
  {
    attendance_id: 'att-018',
    player_id: 'player-006',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-11',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-11T18:00:00Z'),
    updated_at: new Date('2026-02-11T18:00:00Z'),
    player: { user: { name: 'Emma Brown' } },
  },

  // Feb 08, 2026 (Excellent attendance)
  {
    attendance_id: 'att-019',
    player_id: 'player-001',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-08',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-08T18:00:00Z'),
    updated_at: new Date('2026-02-08T18:00:00Z'),
    player: { user: { name: 'John Smith' } },
  },
  {
    attendance_id: 'att-020',
    player_id: 'player-002',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-08',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-08T18:00:00Z'),
    updated_at: new Date('2026-02-08T18:00:00Z'),
    player: { user: { name: 'Sarah Johnson' } },
  },
  {
    attendance_id: 'att-021',
    player_id: 'player-003',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-08',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-08T18:00:00Z'),
    updated_at: new Date('2026-02-08T18:00:00Z'),
    player: { user: { name: 'Mike Davis' } },
  },
  {
    attendance_id: 'att-022',
    player_id: 'player-004',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-08',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-08T18:00:00Z'),
    updated_at: new Date('2026-02-08T18:00:00Z'),
    player: { user: { name: 'Lisa Chen' } },
  },
  {
    attendance_id: 'att-023',
    player_id: 'player-005',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-08',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-08T18:00:00Z'),
    updated_at: new Date('2026-02-08T18:00:00Z'),
    player: { user: { name: 'Tom Wilson' } },
  },
  {
    attendance_id: 'att-024',
    player_id: 'player-006',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-08',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-08T18:00:00Z'),
    updated_at: new Date('2026-02-08T18:00:00Z'),
    player: { user: { name: 'Emma Brown' } },
  },

  // Feb 06, 2026 (Good attendance)
  {
    attendance_id: 'att-025',
    player_id: 'player-001',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-06',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-06T18:00:00Z'),
    updated_at: new Date('2026-02-06T18:00:00Z'),
    player: { user: { name: 'John Smith' } },
  },
  {
    attendance_id: 'att-026',
    player_id: 'player-002',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-06',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-06T18:00:00Z'),
    updated_at: new Date('2026-02-06T18:00:00Z'),
    player: { user: { name: 'Sarah Johnson' } },
  },
  {
    attendance_id: 'att-027',
    player_id: 'player-003',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-06',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-06T18:00:00Z'),
    updated_at: new Date('2026-02-06T18:00:00Z'),
    player: { user: { name: 'Mike Davis' } },
  },
  {
    attendance_id: 'att-028',
    player_id: 'player-004',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-06',
    status: AttendanceStatus.LATE,
    reason: 'Meeting ran late',
    created_at: new Date('2026-02-06T18:10:00Z'),
    updated_at: new Date('2026-02-06T18:10:00Z'),
    player: { user: { name: 'Lisa Chen' } },
  },
  {
    attendance_id: 'att-029',
    player_id: 'player-005',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-06',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-06T18:00:00Z'),
    updated_at: new Date('2026-02-06T18:00:00Z'),
    player: { user: { name: 'Tom Wilson' } },
  },
  {
    attendance_id: 'att-030',
    player_id: 'player-006',
    team_id: MOCK_TEAM.team_id,
    date: '2026-02-06',
    status: AttendanceStatus.ON_TIME,
    reason: null,
    created_at: new Date('2026-02-06T18:00:00Z'),
    updated_at: new Date('2026-02-06T18:00:00Z'),
    player: { user: { name: 'Emma Brown' } },
  },
];

export const MOCK_UPCOMING_SESSIONS = [
  {
    id: 1,
    datetime: new Date().toISOString(), // Today at 6 PM
    location: MOCK_LOCATION.name,
  },
  {
    id: 2,
    datetime: '2026-02-19T18:00:00', // Wednesday
    location: MOCK_LOCATION.name,
  },
  {
    id: 3,
    datetime: '2026-02-21T18:00:00', // Friday
    location: MOCK_LOCATION.name,
  },
];

// This Week (Feb 9-15): 3 sessions (Feb 11, 13, 15)
// - Feb 15: 6 players (5 on-time, 1 late) = 100% present
// - Feb 13: 6 players (4 on-time, 1 late, 1 absent) = 83.3% present
// - Feb 11: 6 players (3 on-time, 1 late, 2 absent) = 66.7% present
// Average attendance (for Feb 11, 13, 15): (4 + 5 + 6) / 3 = 5 players per session
// Recovery days: Feb 15→13 (2 days), 13→11 (2 days) = avg 2 days
export const MOCK_TRAINING_STATS = {
  total_sessions: 3,
  avg_attendance: 5,
  avg_recovery_days: 2,
};

// Attendance trend for chart
// Shows daily attendance over the past sessions
export const MOCK_ATTENDANCE_TREND = [
  { date: '2026-02-06', attended: 5, absent: 1, total: 6 }, // 83.3%
  { date: '2026-02-08', attended: 6, absent: 0, total: 6 }, // 100%
  { date: '2026-02-11', attended: 4, absent: 2, total: 6 }, // 66.7%
  { date: '2026-02-13', attended: 5, absent: 1, total: 6 }, // 83.3%
  { date: '2026-02-15', attended: 6, absent: 0, total: 6 }, // 100%
];

export const MOCK_ATTENDANCE_HISTORY: Array<AttendanceHistoryRecord> = [
  {
    date: 'February 15, 2026',
    short_date: 'Feb 15',
    day: 'Saturday',
    total: 6,
    on_time: 5,
    late: 1,
    absent: 0,
    attended: 6,
    present_rate: 100,
  },
  {
    date: 'February 13, 2026',
    short_date: 'Feb 13',
    day: 'Thursday',
    total: 6,
    on_time: 4,
    late: 1,
    absent: 1,
    attended: 5,
    present_rate: 83,
  },
  {
    date: 'February 11, 2026',
    short_date: 'Feb 11',
    day: 'Tuesday',
    total: 6,
    on_time: 3,
    late: 1,
    absent: 2,
    attended: 4,
    present_rate: 67,
  },
];

export const MOCK_PLAYERS_ATTENDANCE_SUMMARY: PlayerSessionSummary = {
  top_performers: [
    {
      player_name: 'John Smith',
      attended: 5,
      total_sessions: 5,
      attendance_rate: 100,
    },
    {
      player_name: 'Sarah Johnson',
      attended: 5,
      total_sessions: 5,
      attendance_rate: 100,
    },
    {
      player_name: 'Emma Brown',
      attended: 5,
      total_sessions: 5,
      attendance_rate: 100,
    },
  ],
  need_attention: [
    {
      player_name: 'Tom Wilson',
      attended: 2,
      total_sessions: 5,
      attendance_rate: 40,
    },
  ],
};

export const MOCK_ABSENCE_REASONS: Array<AbsenceReason> = [
  {
    name: 'Sick',
    count: 1,
    percentage: 25,
    color: '#E53E3E',
  },
  {
    name: 'Family Emergency',
    count: 1,
    percentage: 25,
    color: '#38A169',
  },
  {
    name: 'Work',
    count: 1,
    percentage: 25,
    color: '#D2D4D7',
  },
  {
    name: 'Meeting ran late',
    count: 2,
    percentage: 50,
    color: '#D2D4D7',
  },
];

export const MOCK_PLAYER_RECORDS_FULL: Array<PlayerStats> = [
  {
    player_name: 'John Smith',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 100,
  },
  {
    player_name: 'Sarah Johnson',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 100,
  },
  {
    player_name: 'Emma Brown',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 100,
  },
  {
    player_name: 'Tom Wilson',
    attended: 2,
    total_sessions: 5,
    attendance_rate: 40,
  },
  {
    player_name: 'Mike Davis',
    attended: 4,
    total_sessions: 5,
    attendance_rate: 80,
  },
];

export const MOCK_PLAYER_RECORDS_TOP_PERFORMERS: Array<PlayerStats> = [
  {
    player_name: 'Player A',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 100,
  },
  {
    player_name: 'Player B',
    attended: 4,
    total_sessions: 5,
    attendance_rate: 80,
  },
  {
    player_name: 'Player C',
    attended: 3,
    total_sessions: 5,
    attendance_rate: 60,
  },
];

export const MOCK_PLAYER_RECORDS_NEED_ATTENTION: Array<PlayerStats> = [
  {
    player_name: 'Player A',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 100,
  },
  {
    player_name: 'Player B',
    attended: 2,
    total_sessions: 5,
    attendance_rate: 40,
  },
  {
    player_name: 'Player C',
    attended: 1,
    total_sessions: 5,
    attendance_rate: 20,
  },
];

export const MOCK_PLAYER_RECORDS_MANY_TOP: Array<PlayerStats> = [
  {
    player_name: 'Player 1',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 100,
  },
  {
    player_name: 'Player 2',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 100,
  },
  {
    player_name: 'Player 3',
    attended: 5,
    total_sessions: 5,
    attendance_rate: 90,
  },
  {
    player_name: 'Player 4',
    attended: 4,
    total_sessions: 5,
    attendance_rate: 80,
  },
  {
    player_name: 'Player 5',
    attended: 4,
    total_sessions: 5,
    attendance_rate: 80,
  },
];

export const MOCK_PLAYER_RECORDS_MANY_NEED_ATTENTION: Array<PlayerStats> = [
  {
    player_name: 'Player 1',
    attended: 2,
    total_sessions: 5,
    attendance_rate: 40,
  },
  {
    player_name: 'Player 2',
    attended: 2,
    total_sessions: 5,
    attendance_rate: 40,
  },
  {
    player_name: 'Player 3',
    attended: 1,
    total_sessions: 5,
    attendance_rate: 20,
  },
  {
    player_name: 'Player 4',
    attended: 1,
    total_sessions: 5,
    attendance_rate: 20,
  },
];
