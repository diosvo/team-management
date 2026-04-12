import {
  AbsenceReason,
  AttendanceHistoryRecord,
  PlayerSessionSummary,
  PlayerStats,
} from '@/types/analytics';

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
    percentage: 20,
  },
  {
    name: 'Family Emergency',
    count: 1,
    percentage: 20,
  },
  {
    name: 'Work',
    count: 1,
    percentage: 20,
  },
  {
    name: 'Meeting ran late',
    count: 2,
    percentage: 40,
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
];

export const MOCK_PLAYER_RECORDS_NEED_ATTENTION: Array<PlayerStats> = [
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
    attendance_rate: 100,
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
];
