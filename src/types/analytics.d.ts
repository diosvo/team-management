export type AnalyticsStats = StatCard['data'] & {
  total_sessions: number;
  avg_attendance: number;
  avg_recovery_days: number;
};

export interface PlayerStats {
  player_name: Picked<UserTable, 'name'>;
  attended: number;
  total_sessions: number;
  attendance_rate: number;
}

export interface PlayerSessionSummary {
  top_performers: Array<PlayerStats>;
  need_attention: Array<PlayerStats>;
}

export interface AbsenceReason {
  name: string;
  count: number;
  percentage: number;
}

export interface AttendanceHistoryRecord {
  date: string;
  short_date: string;
  day: string;
  total: number;
  on_time: number;
  late: number;
  absent: number;
  attended: number;
  present_rate: number;
}
