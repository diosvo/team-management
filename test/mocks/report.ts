import type { ReportHistory, ReportSchedule } from '@/drizzle/schema';
import { Interval, ReportStatus, ReportTrigger, UserRole } from '@/utils/enum';

import { MOCK_TEAM } from './team';
import { MOCK_COACH, MOCK_USER } from './user';

/** Team members as `getReportRecipients` returns them. */
export const MOCK_REPORT_RECIPIENTS = [
  {
    id: MOCK_USER.id,
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    role: MOCK_USER.role,
  },
  {
    id: MOCK_COACH.id,
    name: 'Head Coach',
    email: MOCK_TEAM.email as string,
    role: UserRole.COACH,
  },
];

export const MOCK_REPORT_SCHEDULE: ReportSchedule = {
  schedule_id: 'schedule-123',
  team_id: MOCK_TEAM.team_id,
  interval: Interval.LAST_MONTH,
  recipients: MOCK_REPORT_RECIPIENTS.map(({ email }) => email),
  next_run_at: new Date('2026-11-01T01:00:00Z'),
  last_run_at: null,
  enabled: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_REPORT_HISTORY: ReportHistory = {
  report_id: 'report-123',
  team_id: MOCK_TEAM.team_id,
  schedule_id: MOCK_REPORT_SCHEDULE.schedule_id,
  scheduled_for: new Date('2026-09-01T01:00:00Z'),
  interval: Interval.LAST_MONTH,
  period: '01/08/2026 - 31/08/2026',
  status: ReportStatus.SUCCESS,
  trigger: ReportTrigger.SCHEDULED,
  attempts: 1,
  error: null,
  pathname: 'reports/analytics.pdf',
  filename: 'analytics.pdf',
  resend_email_id: 'email-123',
  delivery_status: null,
  started_at: new Date('2026-09-01T01:00:00Z'),
  completed_at: new Date('2026-09-01T01:01:00Z'),
  expires_at: new Date('2026-11-30T01:00:00Z'),
  created_at: new Date('2026-09-01T01:00:00Z'),
};
