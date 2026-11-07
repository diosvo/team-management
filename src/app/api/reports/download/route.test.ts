import type { NextRequest } from 'next/server';

import { ReportStatus, UserRole } from '@/utils/enum';

import { getFileBytes } from '@/lib/blob';

import { verifySession } from '@/actions/auth';
import { selectReportById } from '@/db/report';
import { MOCK_REPORT_HISTORY } from '@/test/mocks/report';
import { MOCK_AWAY_TEAM, MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_USER } from '@/test/mocks/user';

import { GET } from './route';

vi.mock('@/actions/auth', () => ({ verifySession: vi.fn() }));
vi.mock('@/db/report', () => ({ selectReportById: vi.fn() }));
vi.mock('@/lib/blob', () => ({ getFileBytes: vi.fn() }));

const REPORT_ID = MOCK_REPORT_HISTORY.report_id;

const sessionAs = (role: UserRole) => ({
  user: { ...MOCK_USER, role, team_id: MOCK_TEAM.team_id },
});

const createRequest = (id?: string): NextRequest =>
  ({
    nextUrl: {
      searchParams: new URLSearchParams(id ? { id } : {}),
    },
  }) as unknown as NextRequest;

describe('GET /api/reports/download', () => {
  const mockVerifySession = vi.mocked(verifySession);
  const mockGetReportById = vi.mocked(selectReportById);
  const mockGetFileBytes = vi.mocked(getFileBytes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 when there is no session', async () => {
    mockVerifySession.mockResolvedValue(null);

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(401);
  });

  test('returns 400 when the id is missing', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);

    const response = await GET(createRequest());

    expect(response.status).toBe(400);
  });

  test('returns 404 when the report does not exist', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);
    mockGetReportById.mockResolvedValue(null as never);

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(404);
  });

  test('returns 404 when the report has no pathname yet', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);
    mockGetReportById.mockResolvedValue({ pathname: null } as never);

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(404);
  });

  test('returns 404 when the report has expired', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);
    mockGetReportById.mockResolvedValue({
      ...MOCK_REPORT_HISTORY,
      status: ReportStatus.EXPIRED,
    });

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(404);
  });

  test('returns 403 when a non-admin requests another team’s report', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);
    mockGetReportById.mockResolvedValue({
      ...MOCK_REPORT_HISTORY,
      team_id: MOCK_AWAY_TEAM.team_id,
    });

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(403);
  });

  test('allows a super admin to download any team’s report', async () => {
    mockVerifySession.mockResolvedValue(
      sessionAs(UserRole.SUPER_ADMIN) as never,
    );
    mockGetReportById.mockResolvedValue({
      ...MOCK_REPORT_HISTORY,
      team_id: MOCK_AWAY_TEAM.team_id,
    });
    mockGetFileBytes.mockResolvedValue(new Uint8Array([1, 2, 3]) as never);

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(200);
  });

  test('returns 404 when the blob could not be read', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);
    mockGetReportById.mockResolvedValue(MOCK_REPORT_HISTORY);
    mockGetFileBytes.mockResolvedValue(null as never);

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(404);
  });

  test('streams the PDF with the report filename', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);
    mockGetReportById.mockResolvedValue(MOCK_REPORT_HISTORY);
    mockGetFileBytes.mockResolvedValue(new Uint8Array([1, 2, 3]) as never);

    const response = await GET(createRequest(REPORT_ID));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      `attachment; filename=${MOCK_REPORT_HISTORY.filename}`,
    );
  });

  test('falls back to a default filename when none is stored', async () => {
    mockVerifySession.mockResolvedValue(sessionAs(UserRole.COACH) as never);
    mockGetReportById.mockResolvedValue({
      ...MOCK_REPORT_HISTORY,
      filename: null,
    });
    mockGetFileBytes.mockResolvedValue(new Uint8Array([1, 2, 3]) as never);

    const response = await GET(createRequest(REPORT_ID));

    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename=report.pdf',
    );
  });
});
