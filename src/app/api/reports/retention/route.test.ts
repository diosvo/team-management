import type { NextRequest } from 'next/server';

import { fetchExpiredReports, markReportsExpired } from '@/db/report';
import { deleteFile } from '@/lib/blob';
import { isAuthorizedCron } from '@/lib/request';

import { GET } from './route';

vi.mock('@/db/report', () => ({
  fetchExpiredReports: vi.fn(),
  markReportsExpired: vi.fn(),
}));
vi.mock('@/lib/blob', () => ({ deleteFile: vi.fn() }));
vi.mock('@/lib/request', () => ({ isAuthorizedCron: vi.fn() }));

const createRequest = (): NextRequest =>
  ({ headers: new Headers() }) as unknown as NextRequest;

describe('GET /api/reports/retention', () => {
  const mockIsAuthorizedCron = vi.mocked(isAuthorizedCron);
  const mockFetchExpired = vi.mocked(fetchExpiredReports);
  const mockDeleteFile = vi.mocked(deleteFile);
  const mockMarkExpired = vi.mocked(markReportsExpired);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 when the request is not an authorized cron call', async () => {
    mockIsAuthorizedCron.mockReturnValue(false);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(mockFetchExpired).not.toHaveBeenCalled();
  });

  test('purges nothing when there are no expired reports', async () => {
    mockIsAuthorizedCron.mockReturnValue(true);
    mockFetchExpired.mockResolvedValue([]);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body).toEqual({ purged: 0 });
    expect(mockMarkExpired).not.toHaveBeenCalled();
  });

  test('deletes blobs and marks only the successfully deleted reports expired', async () => {
    mockIsAuthorizedCron.mockReturnValue(true);
    mockFetchExpired.mockResolvedValue([
      { report_id: '1', pathname: 'reports/1.pdf' },
      { report_id: '2', pathname: 'reports/2.pdf' },
    ] as never);
    mockDeleteFile
      .mockResolvedValueOnce(undefined as never)
      .mockRejectedValueOnce(new Error('blob not found'));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(mockDeleteFile).toHaveBeenCalledWith('reports/1.pdf');
    expect(mockDeleteFile).toHaveBeenCalledWith('reports/2.pdf');
    expect(mockMarkExpired).toHaveBeenCalledWith(['1']);
    expect(body).toEqual({ purged: 1 });
  });
});
