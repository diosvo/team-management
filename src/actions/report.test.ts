import {
  deleteReportSchedules,
  fetchReportRecipients,
  insertReportSchedule,
  updateReportSchedule,
} from '@/db/report';
import { sendEmail, type EmailProps } from '@/lib/resend';

import { mockWithAuth, mockWithResource } from '@/test/mocks/auth';
import { MOCK_TEAM } from '@/test/mocks/team';

import { Interval, ReportFrequency, UserRole } from '@/utils/enum';

import {
  getReportRecipients,
  removeReportSchedules,
  sendReportEmail,
  toggleReportSchedule,
  upsertReportSchedule,
} from './report';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/report', () => ({
  fetchReportRecipients: vi.fn(),
  fetchReportSchedules: vi.fn(),
  fetchReportHistory: vi.fn(),
  getReportSchedule: vi.fn(),
  insertReportSchedule: vi.fn(),
  updateReportSchedule: vi.fn(),
  deleteReportSchedules: vi.fn(),
}));

vi.mock('@/db/pg-error', () => ({
  getDbErrorMessage: vi.fn(() => ({ message: 'db error' })),
}));

vi.mock('@/lib/report-schedule', () => ({
  DEFAULT_TIMEZONE: 'Asia/Ho_Chi_Minh',
  computeNextRun: vi.fn(() => new Date('2026-08-01T01:00:00Z')),
  executeSchedule: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: { reports: vi.fn() },
}));

vi.mock('@/lib/resend', () => ({
  sendEmail: vi.fn(),
}));

const MOCK_RECIPIENTS = [
  {
    id: 'user-123',
    name: 'Dios Vo',
    email: 'vtmn1212@gmail.com',
    role: UserRole.COACH,
  },
  {
    id: 'user-456',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: UserRole.PLAYER,
  },
];

describe('Report Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReportRecipients', () => {
    test('calls fetchReportRecipients with team_id', async () => {
      vi.mocked(fetchReportRecipients).mockResolvedValue(MOCK_RECIPIENTS);

      const result = await getReportRecipients();

      expect(fetchReportRecipients).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(MOCK_RECIPIENTS);
    });

    test('returns empty array when no recipients exist', async () => {
      vi.mocked(fetchReportRecipients).mockResolvedValue([]);

      const result = await getReportRecipients();

      expect(result).toEqual([]);
    });

    test('propagates errors from fetchReportRecipients', async () => {
      const message = 'Database error';
      vi.mocked(fetchReportRecipients).mockRejectedValue(new Error(message));

      await expect(getReportRecipients()).rejects.toThrow(message);
    });
  });

  describe('sendReportEmail', () => {
    const PAYLOAD: EmailProps = {
      to: ['coach@example.com'],
      subject: 'Weekly Report',
      html: '<p>Report</p>',
      attachments: [{ content: 'base64', filename: 'report.pdf' }],
    };

    test('calls sendEmail with the payload and returns the response', async () => {
      const response = { data: { id: 'email-id' }, error: null };
      vi.mocked(sendEmail).mockResolvedValue(
        response as Awaited<ReturnType<typeof sendEmail>>,
      );

      const result = await sendReportEmail(PAYLOAD);

      expect(sendEmail).toHaveBeenCalledWith(PAYLOAD);
      expect(result).toEqual(response);
    });

    test('propagates errors from sendEmail', async () => {
      const message = 'network down';
      vi.mocked(sendEmail).mockRejectedValue(new Error(message));

      await expect(sendReportEmail(PAYLOAD)).rejects.toThrow(message);
    });
  });

  describe('upsertReportSchedule', () => {
    const INPUT = {
      interval: Interval.THIS_MONTH,
      frequency: ReportFrequency.MONTHLY,
      day_of_week: null,
      day_of_month: 1,
      recipients: ['coach@example.com'],
    };

    test('inserts a new schedule with a precomputed next run', async () => {
      const result = await upsertReportSchedule('', INPUT);

      expect(insertReportSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          ...INPUT,
          team_id: MOCK_TEAM.team_id,
          next_run_at: expect.any(Date),
        }),
      );
      expect(updateReportSchedule).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('updates an existing schedule when an id is given', async () => {
      const result = await upsertReportSchedule('schedule-1', INPUT);

      expect(updateReportSchedule).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        'schedule-1',
        expect.objectContaining({ interval: INPUT.interval }),
      );
      expect(insertReportSchedule).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('returns an error response when the db throws', async () => {
      vi.mocked(insertReportSchedule).mockRejectedValueOnce(new Error('boom'));

      const result = await upsertReportSchedule('', INPUT);

      expect(result.success).toBe(false);
      expect(result.message).toBe('db error');
    });
  });

  describe('toggleReportSchedule', () => {
    test('updates the enabled flag', async () => {
      const result = await toggleReportSchedule('schedule-1', false);

      expect(updateReportSchedule).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        'schedule-1',
        { enabled: false, next_run_at: undefined },
      );
      expect(result.success).toBe(true);
    });
  });

  describe('removeReportSchedules', () => {
    test('deletes the schedules', async () => {
      const result = await removeReportSchedules(['schedule-1']);

      expect(deleteReportSchedules).toHaveBeenCalledWith(MOCK_TEAM.team_id, [
        'schedule-1',
      ]);
      expect(result.success).toBe(true);
    });
  });
});
