import type { NextRequest } from 'next/server';

import { claimDueSchedules } from '@/db/report';
import { getServiceSession } from '@/lib/report';
import { executeSchedule } from '@/lib/report-schedule';
import { isAuthorizedCron, requestOrigin } from '@/lib/request';
import { ReportTrigger } from '@/utils/enum';

import { GET } from './route';

vi.mock('@/db/report', () => ({ claimDueSchedules: vi.fn() }));
vi.mock('@/lib/report', () => ({ getServiceSession: vi.fn() }));
vi.mock('@/lib/report-schedule', () => ({ executeSchedule: vi.fn() }));
vi.mock('@/lib/request', () => ({
  isAuthorizedCron: vi.fn(),
  requestOrigin: vi.fn(),
}));

const createRequest = (): NextRequest =>
  ({ headers: new Headers() }) as unknown as NextRequest;

describe('GET /api/reports/schedule', () => {
  const mockIsAuthorizedCron = vi.mocked(isAuthorizedCron);
  const mockRequestOrigin = vi.mocked(requestOrigin);
  const mockClaimDueSchedules = vi.mocked(claimDueSchedules);
  const mockGetServiceSession = vi.mocked(getServiceSession);
  const mockExecuteSchedule = vi.mocked(executeSchedule);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthorizedCron.mockReturnValue(true);
    mockRequestOrigin.mockReturnValue({
      host: 'example.com',
      origin: 'https://example.com',
    });
  });

  test('returns 401 when the request is not an authorized cron call', async () => {
    mockIsAuthorizedCron.mockReturnValue(false);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(mockClaimDueSchedules).not.toHaveBeenCalled();
  });

  test('returns 400 when the host header is missing', async () => {
    mockRequestOrigin.mockReturnValue(null);

    const response = await GET(createRequest());

    expect(response.status).toBe(400);
  });

  test('reports nothing processed when no schedules are due', async () => {
    mockClaimDueSchedules.mockResolvedValue([]);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body).toEqual({ processed: 0, message: 'No schedules due' });
    expect(mockGetServiceSession).not.toHaveBeenCalled();
  });

  test('returns 500 when the service account session cannot be created', async () => {
    mockClaimDueSchedules.mockResolvedValue([
      { schedule_id: '1', next_run_at: new Date('2026-01-01') },
    ] as never);
    mockGetServiceSession.mockRejectedValue(
      new Error('Missing service account credentials for scheduled report'),
    );

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe(
      'Missing service account credentials for scheduled report',
    );
    expect(mockExecuteSchedule).not.toHaveBeenCalled();
  });

  test('executes every due schedule with the scheduled occurrence time', async () => {
    const schedule = {
      schedule_id: '1',
      next_run_at: new Date('2026-01-01T08:00:00Z'),
    };
    mockClaimDueSchedules.mockResolvedValue([schedule] as never);
    mockGetServiceSession.mockResolvedValue({
      team_id: 'service-team',
      cookies: [{ name: 'session', value: 'token' }],
    });
    mockExecuteSchedule.mockResolvedValue({ success: true } as never);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(mockExecuteSchedule).toHaveBeenCalledWith({
      schedule,
      scheduled_for: schedule.next_run_at,
      trigger: ReportTrigger.SCHEDULED,
      host: 'example.com',
      origin: 'https://example.com',
      cookies: [{ name: 'session', value: 'token' }],
      session_team_id: 'service-team',
    });
    expect(body).toEqual({
      processed: 1,
      results: [{ success: true }],
    });
  });

  test('stops processing once the tick budget is exhausted', async () => {
    const schedules = [
      { schedule_id: '1', next_run_at: new Date('2026-01-01') },
      { schedule_id: '2', next_run_at: new Date('2026-01-01') },
    ];
    mockClaimDueSchedules.mockResolvedValue(schedules as never);
    mockGetServiceSession.mockResolvedValue({
      team_id: 'service-team',
      cookies: [],
    });

    const dateNowSpy = vi
      .spyOn(Date, 'now')
      // started, loop check (within budget), after first execute (over budget)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(60_000);
    mockExecuteSchedule.mockResolvedValue({ success: true } as never);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(mockExecuteSchedule).toHaveBeenCalledTimes(1);
    expect(body.processed).toBe(1);

    dateNowSpy.mockRestore();
  });
});
