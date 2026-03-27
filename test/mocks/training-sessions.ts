import { InsertTrainingSession, TrainingSession } from '@/drizzle/schema';

import { AttendanceStatus, SessionStatus } from '@/utils/enum';

import { MOCK_LOCATION } from './location';
import { MOCK_TEAM } from './team';
import { MOCK_COACH } from './user';

export const MOCK_TRAINING_SESSION_INPUT: InsertTrainingSession = {
  team_id: MOCK_TEAM.team_id,
  coach_id: MOCK_COACH.id,
  location_id: MOCK_LOCATION.location_id,
  date: '2026-12-12',
  start_time: '09:00:00',
  end_time: '11:00:00',
  status: SessionStatus.COMPLETED,
};

export const MOCK_TRAINING_SESSION: TrainingSession = {
  ...(MOCK_TRAINING_SESSION_INPUT as TrainingSession),
  session_id: 'session-123',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

// Sessions with relationships (for db layer with 'with' queries)
const createSessionWithDetails = (
  id: string,
  status: SessionStatus,
  startTime: string,
  endTime: string,
  attendances: Array<{ attendance_id: string; status: AttendanceStatus }>,
) => ({
  ...MOCK_TRAINING_SESSION,
  session_id: id,
  status,
  start_time: startTime,
  end_time: endTime,
  location: { name: MOCK_LOCATION.name },
  coach: { id: MOCK_COACH.id },
  attendances,
});

export const MOCK_SESSIONS_DB_RESULT = [
  createSessionWithDetails(
    'session-1',
    SessionStatus.COMPLETED,
    '09:00:00',
    '11:00:00',
    [
      { attendance_id: 'att-1', status: AttendanceStatus.ON_TIME },
      { attendance_id: 'att-2', status: AttendanceStatus.LATE },
      { attendance_id: 'att-3', status: AttendanceStatus.ABSENT },
    ],
  ),
  createSessionWithDetails(
    'session-2',
    SessionStatus.SCHEDULED,
    '10:00:00',
    '12:00:00',
    [
      { attendance_id: 'att-4', status: AttendanceStatus.ON_TIME },
      { attendance_id: 'att-5', status: AttendanceStatus.ON_TIME },
    ],
  ),
];

export const MOCK_TRAINING_SESSION_RESPONSE = {
  data: [
    {
      ...MOCK_SESSIONS_DB_RESULT[0],
      attendance_count: 3,
      present_rate: '2/3 · 67.0%',
    },
    {
      ...MOCK_SESSIONS_DB_RESULT[1],
      attendance_count: 2,
      present_rate: '2/2 · 100.0%',
    },
  ],
  stats: {
    completed_sessions: 1,
    avg_attendance: 2.5,
    total_hours: 4,
  },
};
