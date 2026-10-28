import type { NextRequest } from 'next/server';

import { verifySession } from '@/actions/auth';
import { getReportById } from '@/db/report';
import { getFileBytes } from '@/lib/blob';
import { ReportStatus, UserRole } from '@/utils/enum';

import { GET } from './route';

vi.mock('@/actions/auth', () => ({ verifySession: vi.fn() }));
vi.mock('@/db/report', () => ({ getReportById: vi.fn() }));
vi.mock('@/lib/blob', () => ({ getFileBytes: vi.fn() }));

const createRequest = (id?: string): NextRequest =>
  ({
    nextUrl: {
      searchParams: new URLSearchParams(id ? { id } : {}),
    },
  }) as unknown as NextRequest;

describe('GET /api/reports/download', () => {
  const mockVerifySession = vi.mocked(verifySession);
  const mockGetReportById = vi.mocked(getReportById);
  const mockGetFileBytes = vi.mocked(getFileBytes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 when there is no session', async () => {
    mockVerifySession.mockResolvedValue(null);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(401);
  });

  test('returns 400 when the id is missing', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);

    const response = await GET(createRequest());

    expect(response.status).toBe(400);
  });

  test('returns 404 when the report does not exist', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue(null as never);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(404);
  });

  test('returns 404 when the report has no pathname yet', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue({ pathname: null } as never);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(404);
  });

  test('returns 404 when the report has expired', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue({
      pathname: 'reports/1.pdf',
      status: ReportStatus.EXPIRED,
    } as never);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(404);
  });

  test('returns 403 when a non-admin requests another team’s report', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue({
      pathname: 'reports/1.pdf',
      status: ReportStatus.SUCCESS,
      team_id: 'team-2',
    } as never);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(403);
  });

  test('allows a super admin to download any team’s report', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.SUPER_ADMIN, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue({
      pathname: 'reports/1.pdf',
      status: ReportStatus.SUCCESS,
      team_id: 'team-2',
      filename: 'report.pdf',
    } as never);
    mockGetFileBytes.mockResolvedValue(new Uint8Array([1, 2, 3]) as never);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(200);
  });

  test('returns 404 when the blob could not be read', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue({
      pathname: 'reports/1.pdf',
      status: ReportStatus.SUCCESS,
      team_id: 'team-1',
    } as never);
    mockGetFileBytes.mockResolvedValue(null as never);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(404);
  });

  test('streams the PDF with the report filename', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue({
      pathname: 'reports/1.pdf',
      status: ReportStatus.SUCCESS,
      team_id: 'team-1',
      filename: 'my-report.pdf',
    } as never);
    mockGetFileBytes.mockResolvedValue(new Uint8Array([1, 2, 3]) as never);

    const response = await GET(createRequest('report-1'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename=my-report.pdf',
    );
  });

  test('falls back to a default filename when none is stored', async () => {
    mockVerifySession.mockResolvedValue({
      user: { role: UserRole.COACH, team_id: 'team-1' },
    } as never);
    mockGetReportById.mockResolvedValue({
      pathname: 'reports/1.pdf',
      status: ReportStatus.SUCCESS,
      team_id: 'team-1',
      filename: null,
    } as never);
    mockGetFileBytes.mockResolvedValue(new Uint8Array([1, 2, 3]) as never);

    const response = await GET(createRequest('report-1'));

    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename=report.pdf',
    );
  });
});
