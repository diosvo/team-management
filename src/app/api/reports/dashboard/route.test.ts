import { NextRequest } from 'next/server';

import { verifySession } from '@/actions/auth';
import { getBrowser } from '@/lib/puppeteer';
import { Interval } from '@/utils/enum';

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
function createPage() {
  return {
    setViewport: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(undefined),
    // Two evaluate calls: DOM rewrite (undefined) then scrollHeight (number).
    evaluate: vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(1024),
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
  body: unknown = { interval: Interval.THIS_MONTH },
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
    // Authenticated by default; the 401 case overrides this.
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'diosvo' },
    } as never);
  });

  test('returns 401 when there is no session', async () => {
    vi.mocked(verifySession).mockResolvedValue(null as never);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'User not authenticated',
    });
    expect(getBrowser).not.toHaveBeenCalled();
  });

  test('generates a PDF for a valid interval', async () => {
    const browser = createBrowser();
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    const response = await POST(createRequest());

    expect(response.status).toBe(200);

    // Renders the referer URL with forwarded cookies scoped to the host.
    expect(browser.setCookie).toHaveBeenCalledWith({
      name: 'session',
      value: 'abc',
      domain: 'localhost:3000',
    });
    expect(browser.page.goto).toHaveBeenCalledWith('http://localhost:3000', {
      waitUntil: 'networkidle0',
    });
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

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'chromium missing',
    });
  });

  test('returns 500 when the request body cannot be parsed', async () => {
    const response = await POST(createRequest(undefined, { rejectJson: true }));

    expect(response.status).toBe(500);
    expect(getBrowser).not.toHaveBeenCalled();
  });

  test('closes the browser even when PDF generation throws', async () => {
    const browser = createBrowser();
    browser.page.pdf.mockRejectedValue(new Error('render failed'));
    vi.mocked(getBrowser).mockResolvedValue(browser as never);

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    expect(browser.close).toHaveBeenCalled();
  });
});
