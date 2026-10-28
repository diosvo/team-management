import { and, eq, inArray, or } from 'drizzle-orm';

import db from '@/drizzle';
import { PlayerTable, UserTable } from '@/drizzle/schema';

import { EmailStatus, ReportStatus, UserRole } from '@/utils/enum';

import {
  mockDeleteSuccess,
  mockInsertReturningSuccess,
  mockUpdateSuccess,
} from '@/test/db-operations';
import {
  MOCK_REPORT_HISTORY,
  MOCK_REPORT_RECIPIENTS,
  MOCK_REPORT_SCHEDULE,
} from '@/test/mocks/report';
import { MOCK_TEAM } from '@/test/mocks/team';

import {
  claimDueSchedules,
  completeReportRun,
  deleteReportSchedules,
  fetchExpiredReports,
  fetchReportHistory,
  fetchReportRecipients,
  fetchDefaultRecipientEmails,
  fetchReportSchedules,
  getReportById,
  getReportSchedule,
  insertReportHistory,
  insertReportSchedule,
  markReportsExpired,
  reclaimStaleReportRun,
  updateDeliveryStatus,
  updateReportHistory,
  updateReportSchedule,
} from './report';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      UserTable: {
        findMany: vi.fn(),
      },
      ReportScheduleTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      ReportHistoryTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    selectDistinct: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('@/drizzle/schema', () => ({
  UserTable: {
    id: 'id',
    name: 'name',
    email: 'email',
    role: 'role',
    team_id: 'team_id',
  },
  PlayerTable: {
    id: 'player_id',
    is_captain: 'is_captain',
  },
  ReportScheduleTable: {
    schedule_id: 'schedule_id',
    team_id: 'team_id',
    created_at: 'created_at',
    enabled: 'enabled',
    next_run_at: 'next_run_at',
  },
  ReportHistoryTable: {
    report_id: 'report_id',
    team_id: 'team_id',
    schedule_id: 'schedule_id',
    scheduled_for: 'scheduled_for',
    status: 'status',
    started_at: 'started_at',
    created_at: 'created_at',
    pathname: 'pathname',
    expires_at: 'expires_at',
    resend_email_id: 'resend_email_id',
  },
}));

const DEFAULT_REPORT_ROLES = [UserRole.COACH, UserRole.SUPER_ADMIN];

/** Builds the selectDistinct().from().leftJoin().where() chain used in report.ts */
function mockSelectDistinctSuccess(rows: Array<{ email: string }>) {
  const mockWhere = vi.fn().mockResolvedValue(rows);
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });

  vi.mocked(db.selectDistinct).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.selectDistinct>);

  return { mockFrom, mockLeftJoin, mockWhere };
}

function mockSelectDistinctFailure(error: unknown) {
  const mockWhere = vi.fn().mockRejectedValue(error);
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });

  vi.mocked(db.selectDistinct).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.selectDistinct>);

  return { mockFrom, mockLeftJoin, mockWhere };
}

describe('fetchReportRecipients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns recipients when database query succeeds', async () => {
    vi.mocked(db.query.UserTable.findMany).mockResolvedValue(
      MOCK_REPORT_RECIPIENTS as never,
    );

    const result = await fetchReportRecipients(MOCK_TEAM.team_id);

    expect(result).toEqual(MOCK_REPORT_RECIPIENTS);
    // Verify query construction
    expect(db.query.UserTable.findMany).toHaveBeenCalledWith({
      where: and(eq(UserTable.team_id, MOCK_TEAM.team_id)),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  });

  test('returns empty array when database query fails', async () => {
    vi.mocked(db.query.UserTable.findMany).mockRejectedValue(
      new Error('Database error'),
    );

    const result = await fetchReportRecipients(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});

describe('fetchDefaultRecipientEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns distinct emails when database query succeeds', async () => {
    const emails = MOCK_REPORT_RECIPIENTS.map(({ email }) => email);
    const rows = emails.map((email) => ({ email }));
    const { mockFrom, mockLeftJoin, mockWhere } =
      mockSelectDistinctSuccess(rows);

    const result = await fetchDefaultRecipientEmails(MOCK_TEAM.team_id);

    expect(result).toEqual(emails);
    // Verify query construction
    expect(db.selectDistinct).toHaveBeenCalledWith({ email: UserTable.email });
    expect(mockFrom).toHaveBeenCalledWith(UserTable);
    expect(mockLeftJoin).toHaveBeenCalledWith(
      PlayerTable,
      eq(PlayerTable.id, UserTable.id),
    );
    expect(mockWhere).toHaveBeenCalledWith(
      and(
        eq(UserTable.team_id, MOCK_TEAM.team_id),
        or(
          inArray(UserTable.role, DEFAULT_REPORT_ROLES),
          eq(PlayerTable.is_captain, true),
        ),
      ),
    );
  });

  test('returns empty array when no default recipients exist', async () => {
    mockSelectDistinctSuccess([]);

    const result = await fetchDefaultRecipientEmails(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });

  test('returns empty array when database query fails', async () => {
    mockSelectDistinctFailure(new Error('Database error'));

    const result = await fetchDefaultRecipientEmails(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});

describe('fetchReportSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns schedules when the query succeeds', async () => {
    vi.mocked(db.query.ReportScheduleTable.findMany).mockResolvedValue([
      MOCK_REPORT_SCHEDULE,
    ]);

    const result = await fetchReportSchedules(MOCK_TEAM.team_id);

    expect(result).toEqual([MOCK_REPORT_SCHEDULE]);
  });

  test('returns an empty array when the query fails', async () => {
    vi.mocked(db.query.ReportScheduleTable.findMany).mockRejectedValue(
      new Error('db error'),
    );

    const result = await fetchReportSchedules(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});

describe('claimDueSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockTransaction(returnValue: unknown) {
    const forFn = vi.fn().mockResolvedValue(returnValue);
    const limit = vi.fn().mockReturnValue({ for: forFn });
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });

    vi.mocked(db.transaction).mockImplementation((callback) =>
      callback({ select } as never),
    );

    return { select, from, where, orderBy, limit, forFn };
  }

  test('returns due schedules claimed under a row lock', async () => {
    const { forFn } = mockTransaction([MOCK_REPORT_SCHEDULE]);

    const result = await claimDueSchedules(20);

    expect(result).toEqual([MOCK_REPORT_SCHEDULE]);
    expect(forFn).toHaveBeenCalledWith('update', { skipLocked: true });
  });

  test('returns an empty array when the transaction fails', async () => {
    vi.mocked(db.transaction).mockRejectedValue(new Error('db error'));

    const result = await claimDueSchedules(20);

    expect(result).toEqual([]);
  });
});

describe('getReportSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns the matching schedule for the team', async () => {
    vi.mocked(db.query.ReportScheduleTable.findFirst).mockResolvedValue(
      MOCK_REPORT_SCHEDULE,
    );

    const result = await getReportSchedule(
      MOCK_TEAM.team_id,
      MOCK_REPORT_SCHEDULE.schedule_id,
    );

    expect(result).toEqual(MOCK_REPORT_SCHEDULE);
  });
});

describe('insertReportSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts the schedule and returns its id', async () => {
    const { mockValues } = mockInsertReturningSuccess([
      { schedule_id: MOCK_REPORT_SCHEDULE.schedule_id },
    ]);

    const result = await insertReportSchedule(MOCK_REPORT_SCHEDULE as never);

    expect(mockValues).toHaveBeenCalledWith(MOCK_REPORT_SCHEDULE);
    expect(result).toEqual([{ schedule_id: MOCK_REPORT_SCHEDULE.schedule_id }]);
  });
});

describe('updateReportSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates the schedule scoped to its team', async () => {
    const { mockSet } = mockUpdateSuccess(undefined);

    await updateReportSchedule(MOCK_TEAM.team_id, 'schedule-123', {
      enabled: false,
    });

    expect(mockSet).toHaveBeenCalledWith({ enabled: false });
  });
});

describe('deleteReportSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes the given schedules scoped to the team', async () => {
    const mockWhere = mockDeleteSuccess(undefined);

    await deleteReportSchedules(MOCK_TEAM.team_id, ['schedule-123']);

    expect(mockWhere).toHaveBeenCalled();
  });
});

describe('fetchReportHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns history when the query succeeds', async () => {
    vi.mocked(db.query.ReportHistoryTable.findMany).mockResolvedValue([
      MOCK_REPORT_HISTORY,
    ]);

    const result = await fetchReportHistory(MOCK_TEAM.team_id);

    expect(result).toEqual([MOCK_REPORT_HISTORY]);
  });

  test('returns an empty array when the query fails', async () => {
    vi.mocked(db.query.ReportHistoryTable.findMany).mockRejectedValue(
      new Error('db error'),
    );

    const result = await fetchReportHistory(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});

describe('getReportById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns the matching report', async () => {
    vi.mocked(db.query.ReportHistoryTable.findFirst).mockResolvedValue(
      MOCK_REPORT_HISTORY,
    );

    const result = await getReportById(MOCK_REPORT_HISTORY.report_id);

    expect(result).toEqual(MOCK_REPORT_HISTORY);
  });
});

describe('insertReportHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts the report run and returns its id', async () => {
    const { mockValues } = mockInsertReturningSuccess([
      { report_id: MOCK_REPORT_HISTORY.report_id },
    ]);

    const result = await insertReportHistory(MOCK_REPORT_HISTORY as never);

    expect(mockValues).toHaveBeenCalledWith(MOCK_REPORT_HISTORY);
    expect(result).toEqual([{ report_id: MOCK_REPORT_HISTORY.report_id }]);
  });
});

describe('updateReportHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates the report run', async () => {
    const { mockSet } = mockUpdateSuccess(undefined);

    await updateReportHistory(MOCK_REPORT_HISTORY.report_id, {
      status: ReportStatus.FAILED,
    });

    expect(mockSet).toHaveBeenCalledWith({ status: ReportStatus.FAILED });
  });
});

describe('reclaimStaleReportRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns the reclaimed run when one is stale', async () => {
    const { mockWhere } = mockUpdateSuccess(undefined);
    const mockReturning = vi.fn().mockResolvedValue([
      {
        report_id: MOCK_REPORT_HISTORY.report_id,
        pathname: MOCK_REPORT_HISTORY.pathname,
      },
    ]);
    mockWhere.mockReturnValue({ returning: mockReturning });

    const result = await reclaimStaleReportRun(
      MOCK_REPORT_SCHEDULE.schedule_id,
      MOCK_REPORT_HISTORY.scheduled_for!,
      new Date('2026-09-01T02:00:00Z'),
    );

    expect(result).toEqual({
      report_id: MOCK_REPORT_HISTORY.report_id,
      pathname: MOCK_REPORT_HISTORY.pathname,
    });
  });

  test('returns undefined when no run is stale', async () => {
    const { mockWhere } = mockUpdateSuccess(undefined);
    mockWhere.mockReturnValue({ returning: vi.fn().mockResolvedValue([]) });

    const result = await reclaimStaleReportRun(
      MOCK_REPORT_SCHEDULE.schedule_id,
      MOCK_REPORT_HISTORY.scheduled_for!,
      new Date('2026-09-01T02:00:00Z'),
    );

    expect(result).toBeUndefined();
  });
});

describe('completeReportRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('updates the report run and its schedule in the same transaction', async () => {
    const historyWhere = vi.fn().mockResolvedValue(undefined);
    const historySet = vi.fn().mockReturnValue({ where: historyWhere });
    const scheduleWhere = vi.fn().mockResolvedValue(undefined);
    const scheduleSet = vi.fn().mockReturnValue({ where: scheduleWhere });

    const update = vi
      .fn()
      .mockReturnValueOnce({ set: historySet })
      .mockReturnValueOnce({ set: scheduleSet });

    vi.mocked(db.transaction).mockImplementation((callback) =>
      callback({ update } as never),
    );

    await completeReportRun(
      MOCK_REPORT_HISTORY.report_id,
      { status: ReportStatus.SUCCESS },
      MOCK_REPORT_SCHEDULE.schedule_id,
      { last_run_at: new Date('2026-09-01') },
    );

    expect(historySet).toHaveBeenCalledWith({ status: ReportStatus.SUCCESS });
    expect(scheduleSet).toHaveBeenCalledWith({
      last_run_at: new Date('2026-09-01'),
    });
  });
});

describe('updateDeliveryStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('stamps the delivery status for the matching run', async () => {
    const { mockSet } = mockUpdateSuccess(undefined);

    await updateDeliveryStatus('email-123', EmailStatus.DELIVERED);

    expect(mockSet).toHaveBeenCalledWith({
      delivery_status: EmailStatus.DELIVERED,
    });
  });
});

describe('fetchExpiredReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns expired reports when the query succeeds', async () => {
    vi.mocked(db.query.ReportHistoryTable.findMany).mockResolvedValue([
      MOCK_REPORT_HISTORY,
    ]);

    const result = await fetchExpiredReports(new Date('2026-12-01'));

    expect(result).toEqual([MOCK_REPORT_HISTORY]);
  });

  test('returns an empty array when the query fails', async () => {
    vi.mocked(db.query.ReportHistoryTable.findMany).mockRejectedValue(
      new Error('db error'),
    );

    const result = await fetchExpiredReports(new Date('2026-12-01'));

    expect(result).toEqual([]);
  });
});

describe('markReportsExpired', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('marks the given reports expired and drops their blob reference', async () => {
    const { mockSet } = mockUpdateSuccess(undefined);

    await markReportsExpired([MOCK_REPORT_HISTORY.report_id]);

    expect(mockSet).toHaveBeenCalledWith({
      status: ReportStatus.EXPIRED,
      pathname: null,
    });
  });
});
