import auth from '@/lib/auth';
import { uploadFile } from '@/lib/blob';
import { getBrowser } from '@/lib/puppeteer';

import { Interval } from '@/utils/enum';

import {
  dashboardPath,
  getServiceSession,
  renderReportPdf,
  reportExpiresAt,
  reportFilename,
  RETENTION_DAYS,
  storeReportPdf,
} from './report';

vi.mock('@/lib/puppeteer', () => ({ getBrowser: vi.fn() }));
vi.mock('@/lib/blob', () => ({ uploadFile: vi.fn() }));
vi.mock('@/lib/auth', () => ({
  default: { api: { signInEmail: vi.fn() } },
}));
vi.mock('@env', () => ({
  default: { PW_USERNAME: 'service@example.com', PW_PASSWORD: 'secret' },
}));

describe('reportExpiresAt', () => {
  test('is RETENTION_DAYS from now', () => {
    const before = Date.now();
    const result = reportExpiresAt();
    const after = Date.now();

    expect(result.getTime()).toBeGreaterThanOrEqual(
      before + RETENTION_DAYS * 86_400_000,
    );
    expect(result.getTime()).toBeLessThanOrEqual(
      after + RETENTION_DAYS * 86_400_000,
    );
  });
});

describe('dashboardPath', () => {
  test('builds the dashboard path with the date range as query params', () => {
    expect(
      dashboardPath({ from: '2026-01-01', to: '2026-01-31' } as never),
    ).toBe('/dashboard?from=2026-01-01&to=2026-01-31');
  });
});

describe('reportFilename', () => {
  test('strips non-numeric characters from the period', () => {
    expect(
      reportFilename(Interval.LAST_MONTH, '01/08/2026 - 31/08/2026'),
    ).toBe('analytics-last_month-0108202631082026.pdf');
  });
});

describe('renderReportPdf', () => {
  // `page.evaluate` runs its callback in the browser; executing it for real
  // against jsdom's `document` (the closest in-process stand-in) exercises
  // the DOM-rewrite logic instead of leaving it as dead code under the mock.
  function createPage() {
    document.body.innerHTML = '<div id="reports-dashboard"></div>';

    return {
      setViewport: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn((fn: () => unknown) => Promise.resolve(fn())),
      evaluate: vi.fn((fn: (arg?: unknown) => unknown, arg?: unknown) =>
        Promise.resolve(fn(arg)),
      ),
      addStyleTag: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
    };
  }

  function createBrowser(page = createPage()) {
    return {
      page,
      newPage: vi.fn().mockResolvedValue(page),
      setCookie: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('renders the dashboard and returns a PDF buffer', async () => {
    const browser = createBrowser();
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    const result = await renderReportPdf({
      origin: 'https://portal.app',
      path: '/dashboard?from=2026-01-01',
      host: 'portal.app',
      cookies: [{ name: 'session', value: 'abc' }],
      period: '01/01/2026 - 31/01/2026',
    });

    expect(browser.setCookie).toHaveBeenCalledWith({
      name: 'session',
      value: 'abc',
      domain: 'portal.app',
    });
    expect(browser.page.goto).toHaveBeenCalledWith(
      'https://portal.app/dashboard?from=2026-01-01',
      { waitUntil: 'networkidle0' },
    );
    expect(result).toEqual(Buffer.from('%PDF-1.4 mock'));
    expect(browser.close).toHaveBeenCalled();
  });

  test('closes the browser even when rendering throws', async () => {
    const page = createPage();
    page.goto.mockRejectedValue(new Error('navigation failed'));
    const browser = createBrowser(page);
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    await expect(
      renderReportPdf({
        origin: 'https://portal.app',
        host: 'portal.app',
        cookies: [],
        period: '01/01/2026 - 31/01/2026',
      }),
    ).rejects.toThrow('navigation failed');

    expect(browser.close).toHaveBeenCalled();
  });

  test('falls back to the origin when no path is given', async () => {
    const browser = createBrowser();
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    await renderReportPdf({
      origin: 'https://portal.app',
      host: 'portal.app',
      cookies: [],
      period: '01/01/2026 - 31/01/2026',
    });

    expect(browser.page.goto).toHaveBeenCalledWith('https://portal.app', {
      waitUntil: 'networkidle0',
    });
  });

  test('rewrites the dashboard DOM into the printable layout', async () => {
    const browser = createBrowser();
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    await renderReportPdf({
      origin: 'https://portal.app',
      host: 'portal.app',
      cookies: [],
      period: '01/01/2026 - 31/01/2026',
    });

    expect(document.getElementById('pdf-wrapper')).toBeTruthy();
    expect(document.getElementById('pdf-duration')?.textContent).toBe(
      'Duration: 01/01/2026 - 31/01/2026',
    );
    expect(document.title).toBe('SGR | Analytics Overview Report');
  });

  test('does nothing when the dashboard grid is missing from the page', async () => {
    const page = createPage();
    document.body.innerHTML = '';
    const browser = createBrowser(page);
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    const result = await renderReportPdf({
      origin: 'https://portal.app',
      host: 'portal.app',
      cookies: [],
      period: '01/01/2026 - 31/01/2026',
    });

    expect(document.getElementById('pdf-wrapper')).toBeNull();
    expect(result).toEqual(Buffer.from('%PDF-1.4 mock'));
  });

  test('tolerates the skeleton-clearing wait timing out', async () => {
    const page = createPage();
    page.waitForFunction.mockRejectedValue(new Error('timeout'));
    const browser = createBrowser(page);
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    const result = await renderReportPdf({
      origin: 'https://portal.app',
      host: 'portal.app',
      cookies: [],
      period: '01/01/2026 - 31/01/2026',
    });

    expect(result).toEqual(Buffer.from('%PDF-1.4 mock'));
  });
});

describe('storeReportPdf', () => {
  test('uploads the buffer as a PDF', async () => {
    const blob = { pathname: 'reports/1.pdf' };
    vi.mocked(uploadFile).mockResolvedValue(blob as never);

    const result = await storeReportPdf(
      'reports/1.pdf',
      Buffer.from('%PDF-1.4'),
    );

    expect(uploadFile).toHaveBeenCalledWith(
      'reports/1.pdf',
      Buffer.from('%PDF-1.4'),
      { contentType: 'application/pdf' },
    );
    expect(result).toBe(blob);
  });
});

describe('getServiceSession', () => {
  const mockSignInEmail = vi.mocked(auth.api.signInEmail);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('throws when service account credentials are missing', async () => {
    vi.doMock('@env', () => ({
      default: { PW_USERNAME: undefined, PW_PASSWORD: undefined },
    }));
    vi.resetModules();
    const { getServiceSession: getServiceSessionNoCreds } = await import(
      './report'
    );

    await expect(getServiceSessionNoCreds()).rejects.toThrow(
      'Missing service account credentials for scheduled report',
    );

    vi.doUnmock('@env');
    vi.resetModules();
  });

  test('throws when the sign-in response has no session cookie', async () => {
    mockSignInEmail.mockResolvedValue({
      headers: { getSetCookie: () => [] },
      json: async () => ({ user: { team_id: 'team-1' } }),
    } as never);

    await expect(getServiceSession()).rejects.toThrow(
      'Service account sign-in returned no session cookie',
    );
  });

  test('returns the team id and parsed session cookies', async () => {
    mockSignInEmail.mockResolvedValue({
      headers: {
        getSetCookie: () => [
          'better-auth.session_token=abc123; Path=/; HttpOnly',
          'other=value; Path=/',
        ],
      },
      json: async () => ({ user: { team_id: 'team-1' } }),
    } as never);

    const result = await getServiceSession();

    expect(mockSignInEmail).toHaveBeenCalledWith({
      body: { email: 'service@example.com', password: 'secret' },
      asResponse: true,
    });
    expect(result).toEqual({
      team_id: 'team-1',
      cookies: [
        { name: 'better-auth.session_token', value: 'abc123' },
        { name: 'other', value: 'value' },
      ],
    });
  });
});
