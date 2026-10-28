import { NextRequest } from 'next/server';

import { verifySession } from '@/actions/auth';
import { getBrowser } from '@/lib/puppeteer';
import { Status } from '@/utils/response';

import { POST } from './route';

vi.mock('@/lib/puppeteer', () => ({
  getBrowser: vi.fn(),
}));

vi.mock('@/actions/auth', () => ({
  verifySession: vi.fn(),
}));

vi.mock('@env', () => ({
  default: { NODE_ENV: 'development' },
}));

// Minimal Puppeteer page/browser doubles exposing only what the route touches.
// `evaluate` runs its callback for real against jsdom's `document` (the
// closest in-process stand-in for the browser page) so the DOM-rewrite logic
// is actually exercised instead of left as dead code under the mock.
function createPage() {
  document.body.innerHTML = '<div id="reports-dashboard"></div>';

  return {
    setViewport: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
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

function createRequest(
  body: unknown = {
    from: '2026-02-01',
    to: '2026-02-28',
    filename: 'report.pdf',
  },
  { rejectJson = false }: { rejectJson?: boolean } = {},
): NextRequest {
  return {
    json: rejectJson
      ? vi.fn().mockRejectedValue(new Error('invalid json'))
      : vi.fn().mockResolvedValue(body),
    headers: {
      get: vi.fn((key: string) =>
        key === 'referer'
          ? 'http://localhost:3000/reports'
          : key === 'host'
            ? 'localhost:3000'
            : null,
      ),
    },
    cookies: {
      getAll: vi.fn(() => [{ name: 'session', value: 'abc' }]),
    },
  } as unknown as NextRequest;
}

describe('POST /api/reports/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    // Authenticated by default; the 401 case overrides this.
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'diosvo' },
    } as never);
  });

  test('returns 401 when there is no session', async () => {
    vi.mocked(verifySession).mockResolvedValue(null as never);

    const response = await POST(createRequest());

    expect(response.status).toBe(Status.UNAUTHORIZED);
    await expect(response.json()).resolves.toEqual({
      error: 'User not authenticated',
    });
    expect(getBrowser).not.toHaveBeenCalled();
  });

  test('returns 400 when the host header is missing', async () => {
    const request = createRequest();
    vi.mocked(request.headers.get).mockImplementation(() => null);

    const response = await POST(request);

    expect(response.status).toBe(Status.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      error: 'Missing request headers required for report generation',
    });
    expect(getBrowser).not.toHaveBeenCalled();
  });

  test('generates a PDF for a valid period', async () => {
    const browser = createBrowser();
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    const response = await POST(createRequest());

    expect(response.status).toBe(Status.OK);

    // The DOM was rewritten into the printable layout.
    expect(document.getElementById('pdf-wrapper')).toBeTruthy();
    expect(document.title).toBe('SGR | Analytics Overview Report');

    // Renders the referer URL with forwarded cookies scoped to the host.
    expect(browser.setCookie).toHaveBeenCalledWith({
      name: 'session',
      value: 'abc',
      domain: 'localhost:3000',
    });
    expect(browser.page.goto).toHaveBeenCalledWith(
      'http://localhost:3000/dashboard?from=2026-02-01&to=2026-02-28',
      { waitUntil: 'networkidle0' },
    );
    expect(browser.page.waitForSelector).toHaveBeenCalledWith(
      '#reports-dashboard',
      { timeout: 3000 },
    );
    expect(browser.page.pdf).toHaveBeenCalled();

    // Response body carries the generated PDF buffer.
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.toString()).toBe('%PDF-1.4 mock');

    // Browser is always closed.
    expect(browser.close).toHaveBeenCalled();
  });

  test('returns 500 with the error message in development when generation fails', async () => {
    vi.mocked(getBrowser).mockRejectedValue(new Error('chromium missing'));

    const response = await POST(createRequest());

    expect(response.status).toBe(Status.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: 'chromium missing',
    });
  });

  test('hides the error message outside of development', async () => {
    vi.doMock('@env', () => ({ default: { NODE_ENV: 'production' } }));
    vi.resetModules();
    const { POST: postProd } = await import('./route');
    const { getBrowser: getBrowserProd } = await import('@/lib/puppeteer');
    const { verifySession: verifySessionProd } = await import(
      '@/actions/auth'
    );
    vi.mocked(verifySessionProd).mockResolvedValue({
      user: { id: 'diosvo' },
    } as never);
    vi.mocked(getBrowserProd).mockRejectedValue(new Error('chromium missing'));

    const response = await postProd(createRequest());

    expect(response.status).toBe(Status.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to generate the report. Please try again later',
    });

    vi.doUnmock('@env');
    vi.resetModules();
  });

  test('returns 500 when the request body cannot be parsed', async () => {
    const response = await POST(createRequest(undefined, { rejectJson: true }));

    expect(response.status).toBe(Status.INTERNAL_SERVER_ERROR);
    expect(getBrowser).not.toHaveBeenCalled();
  });

  test('closes the browser even when PDF generation throws', async () => {
    const browser = createBrowser();
    browser.page.pdf.mockRejectedValue(new Error('render failed'));
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    const response = await POST(createRequest());

    expect(response.status).toBe(Status.INTERNAL_SERVER_ERROR);
    expect(browser.close).toHaveBeenCalled();
  });
});
