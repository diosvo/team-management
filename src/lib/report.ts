import env from '@env';

import auth from '@/lib/auth';
import { getBrowser } from '@/lib/puppeteer';
import { uploadFile } from '@/lib/blob';

import { Interval } from '@/utils/enum';

/** Days a generated report stays downloadable before the retention job prunes it. */
export const RETENTION_DAYS = 90;

/** Blob expiry for a report generated now. */
export function reportExpiresAt(): Date {
  return new Date(Date.now() + RETENTION_DAYS * 86_400_000);
}

/** Blob pathname for a report PDF, unique-suffixed on upload. */
export function reportFilename(interval: Interval, period: string): string {
  const stamp = period.replace(/[^0-9]/g, '');
  return `analytics-${interval}-${stamp}.pdf`;
}

export interface RenderOptions {
  /** Origin to render, e.g. `https://portal.app`. */
  origin: string;
  /** Path under the origin, e.g. `/dashboard?interval=last_month`. */
  path?: string;
  /** Cookie domain (request host). */
  host: string;
  /** Session cookies forwarded to the headless browser. */
  cookies: Array<{ name: string; value: string }>;
  /** Human-readable reporting window. */
  period: string;
}

/**
 * Render the analytics dashboard to a PDF buffer using a headless browser.
 * Mirrors `/api/reports/dashboard`: it forwards the caller's session cookies so
 * the protected dashboard renders, then prints the `#reports-dashboard` grid.
 */
export async function renderReportPdf({
  origin,
  path,
  host,
  cookies,
  period,
}: RenderOptions): Promise<Buffer> {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();

    await browser.setCookie(
      ...cookies.map((cookie) => ({ ...cookie, domain: host })),
    );

    // 1200px keeps Chakra's md breakpoint active for the print layout.
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto(`${origin}${path ?? ''}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#reports-dashboard', { timeout: 3000 });

    const durationLabel = `Duration: ${period}`;
    const generatedOn = `Generated on ${new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    })}`;

    await page.evaluate(
      ({ durationLabel, generatedOn }) => {
        const grid = document.getElementById('reports-dashboard');
        if (!grid) return;

        const title = document.createElement('h1');
        title.id = 'pdf-title';
        title.textContent = 'Analytics Overview Report ';

        const duration = document.createElement('p');
        duration.id = 'pdf-duration';
        duration.textContent = durationLabel;

        const description = document.createElement('p');
        description.id = 'pdf-description';
        description.textContent = generatedOn;

        const meta = document.createElement('div');
        meta.id = 'pdf-meta';
        meta.append(duration, description);

        const wrapper = document.createElement('div');
        wrapper.id = 'pdf-wrapper';
        wrapper.append(title, meta, grid);

        document.title = 'SGR | Analytics Overview Report';
        document.body.replaceChildren(wrapper);
      },
      { durationLabel, generatedOn },
    );

    await page.addStyleTag({
      content: `
        #pdf-title { font-size: 1.5rem; font-weight: 700; }
        #pdf-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 1rem;
        }
        #pdf-description { font-size: 13px; color: #666; }
        #reports-dashboard { grid-template-columns: repeat(2, 1fr) !important; }
      `,
    });

    const pageHeight = await page.evaluate(() => document.body.scrollHeight);

    const pdfBuffer = await page.pdf({
      width: '210mm',
      height: `${pageHeight}px`,
      printBackground: true,
      margin: { top: 20, right: 24, bottom: 20, left: 24 },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/** Upload a report PDF to private Blob storage. */
export async function storeReportPdf(pathname: string, buffer: Buffer) {
  return await uploadFile(pathname, buffer, {
    contentType: 'application/pdf',
  });
}

/**
 * Sign in with the service account so the cron can render protected pages
 * headlessly. Returns the session cookies to forward to the browser.
 */
export async function getServiceCookies(): Promise<
  Array<{ name: string; value: string }>
> {
  if (!env.PW_USERNAME || !env.PW_PASSWORD) {
    throw new Error('Missing service account credentials for scheduled report');
  }

  const response = await auth.api.signInEmail({
    body: { email: env.PW_USERNAME, password: env.PW_PASSWORD },
    asResponse: true,
  });

  const setCookies = response.headers.getSetCookie();
  if (setCookies.length === 0) {
    throw new Error('Service account sign-in returned no session cookie');
  }

  return setCookies.map((cookie) => {
    const [pair] = cookie.split(';');
    const separator = pair.indexOf('=');
    return {
      name: pair.slice(0, separator).trim(),
      value: pair.slice(separator + 1).trim(),
    };
  });
}

