import { cookies, headers } from 'next/headers';

import {
  deleteReportSchedules,
  fetchReportHistory,
  fetchReportRecipients,
  fetchReportSchedules,
  getReportSchedule,
  insertReportSchedule,
  updateReportSchedule,
} from '@/db/report';
import { computeNextRun, executeSchedule } from '@/lib/report-schedule';
import { requestOrigin } from '@/lib/request';
import { sendEmail, type EmailProps } from '@/lib/resend';

import {
  mockWithAuth,
  mockWithResource,
  resetMockAuthUser,
  setMockAuthUser,
} from '@/test/mocks/auth';
import { MOCK_USER } from '@/test/mocks/user';
import {
  MOCK_REPORT_HISTORY,
  MOCK_REPORT_RECIPIENTS,
  MOCK_REPORT_SCHEDULE,
} from '@/test/mocks/report';
import { MOCK_TEAM } from '@/test/mocks/team';

import type { UpsertReportScheduleValues } from '@/schemas/report';
import { Interval, ReportTrigger } from '@/utils/enum';

import {
  getReportHistory,
  getReportRecipients,
  getReportSchedules,
  removeReportSchedules,
  runReportNow,
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
  computeNextRun: vi.fn(() => new Date('2026-08-01T01:00:00Z')),
  executeSchedule: vi.fn(),
}));

vi.mock('@/lib/request', () => ({
  requestOrigin: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: { reports: vi.fn() },
}));

vi.mock('@/lib/resend', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

const { schedule_id, recipients } = MOCK_REPORT_SCHEDULE;

describe('Report Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReportRecipients', () => {
    test('calls fetchReportRecipients with team_id', async () => {
      vi.mocked(fetchReportRecipients).mockResolvedValue(
        MOCK_REPORT_RECIPIENTS,
      );

      const result = await getReportRecipients();

      expect(fetchReportRecipients).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(MOCK_REPORT_RECIPIENTS);
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

    test('returns an empty array without querying when the user has no team', async () => {
      setMockAuthUser({ ...MOCK_USER, team_id: '' });

      const result = await getReportRecipients();

      expect(result).toEqual([]);
      expect(fetchReportRecipients).not.toHaveBeenCalled();

      resetMockAuthUser();
    });
  });

  describe('sendReportEmail', () => {
    const PAYLOAD: EmailProps = {
      to: recipients,
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
    const INPUT: UpsertReportScheduleValues = {
      interval: Interval.LAST_MONTH,
      recipients,
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
      const result = await upsertReportSchedule(schedule_id, INPUT);

      expect(updateReportSchedule).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        schedule_id,
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

  describe('getReportSchedules', () => {
    test('fetches schedules scoped to the team', async () => {
      vi.mocked(fetchReportSchedules).mockResolvedValue([
        MOCK_REPORT_SCHEDULE,
      ]);

      const result = await getReportSchedules();

      expect(fetchReportSchedules).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual([MOCK_REPORT_SCHEDULE]);
    });
  });

  describe('getReportHistory', () => {
    test('fetches history scoped to the team', async () => {
      vi.mocked(fetchReportHistory).mockResolvedValue([MOCK_REPORT_HISTORY]);

      const result = await getReportHistory();

      expect(fetchReportHistory).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual([MOCK_REPORT_HISTORY]);
    });
  });

  describe('toggleReportSchedule', () => {
    test('updates the enabled flag', async () => {
      const result = await toggleReportSchedule(schedule_id, false);

      expect(updateReportSchedule).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        schedule_id,
        { enabled: false, next_run_at: undefined },
      );
      expect(result.success).toBe(true);
    });

    test('recomputes next_run_at when re-enabling a known schedule', async () => {
      vi.mocked(getReportSchedule).mockResolvedValue(MOCK_REPORT_SCHEDULE);

      const result = await toggleReportSchedule(schedule_id, true);

      expect(updateReportSchedule).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        schedule_id,
        { enabled: true, next_run_at: new Date('2026-08-01T01:00:00Z') },
      );
      expect(result.success).toBe(true);
    });

    test('enables without recomputing when the schedule no longer exists', async () => {
      vi.mocked(getReportSchedule).mockResolvedValue(undefined);

      const result = await toggleReportSchedule(schedule_id, true);

      expect(updateReportSchedule).toHaveBeenCalledWith(
        MOCK_TEAM.team_id,
        schedule_id,
        { enabled: true, next_run_at: undefined },
      );
      expect(result.success).toBe(true);
    });

    test('returns an error response when the db throws', async () => {
      vi.mocked(updateReportSchedule).mockRejectedValueOnce(
        new Error('boom'),
      );

      const result = await toggleReportSchedule(schedule_id, false);

      expect(result.success).toBe(false);
    });
  });

  describe('removeReportSchedules', () => {
    test('deletes the schedules', async () => {
      const result = await removeReportSchedules([schedule_id]);

      expect(deleteReportSchedules).toHaveBeenCalledWith(MOCK_TEAM.team_id, [
        schedule_id,
      ]);
      expect(result.success).toBe(true);
    });

    test('returns an error response when the db throws', async () => {
      vi.mocked(deleteReportSchedules).mockRejectedValueOnce(
        new Error('boom'),
      );

      const result = await removeReportSchedules([schedule_id]);

      expect(result.success).toBe(false);
    });
  });

  describe('runReportNow', () => {
    const mockCookies = {
      getAll: vi.fn(() => [{ name: 'session', value: 'abc', extra: 'x' }]),
    };

    beforeEach(() => {
      vi.mocked(headers).mockResolvedValue({} as never);
      vi.mocked(cookies).mockResolvedValue(mockCookies as never);
      vi.mocked(requestOrigin).mockReturnValue({
        host: 'example.com',
        origin: 'https://example.com',
      });
    });

    test('returns an error when the schedule no longer exists', async () => {
      vi.mocked(getReportSchedule).mockResolvedValue(undefined);

      const result = await runReportNow(schedule_id);

      expect(result.success).toBe(false);
      expect(executeSchedule).not.toHaveBeenCalled();
    });

    test('returns an error when the request origin is unknown', async () => {
      vi.mocked(getReportSchedule).mockResolvedValue(MOCK_REPORT_SCHEDULE);
      vi.mocked(requestOrigin).mockReturnValue(null);

      const result = await runReportNow(schedule_id);

      expect(result.success).toBe(false);
      expect(executeSchedule).not.toHaveBeenCalled();
    });

    test('executes the schedule immediately and revalidates on success', async () => {
      vi.mocked(getReportSchedule).mockResolvedValue(MOCK_REPORT_SCHEDULE);
      vi.mocked(executeSchedule).mockResolvedValue({
        outcome: 'sent',
      } as never);

      const result = await runReportNow(schedule_id);

      expect(executeSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          schedule: MOCK_REPORT_SCHEDULE,
          trigger: ReportTrigger.MANUAL,
          host: 'example.com',
          origin: 'https://example.com',
          session_team_id: MOCK_TEAM.team_id,
          cookies: [{ name: 'session', value: 'abc' }],
        }),
      );
      expect(result.success).toBe(true);
    });

    test('returns the failure message when the run does not send', async () => {
      vi.mocked(getReportSchedule).mockResolvedValue(MOCK_REPORT_SCHEDULE);
      vi.mocked(executeSchedule).mockResolvedValue({
        outcome: 'failed',
        error: 'puppeteer crashed',
      } as never);

      const result = await runReportNow(schedule_id);

      expect(result.success).toBe(false);
      expect(result.message).toBe('puppeteer crashed');
    });

    test('falls back to a generic message when the run fails without an error', async () => {
      vi.mocked(getReportSchedule).mockResolvedValue(MOCK_REPORT_SCHEDULE);
      vi.mocked(executeSchedule).mockResolvedValue({
        outcome: 'failed',
      } as never);

      const result = await runReportNow(schedule_id);

      expect(result.success).toBe(false);
    });
  });
});
