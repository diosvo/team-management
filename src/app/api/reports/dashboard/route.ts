import { NextRequest, NextResponse } from 'next/server';

import { getBrowser } from '@/lib/puppeteer';
import { formatDate, TIME_DURATION } from '@/utils/formatter';
import env from '@env';

const devEnv = env.NODE_ENV === 'development';

export async function POST(req: NextRequest) {
  let browser;

  try {
    const { interval } = await req.json();
    const period = TIME_DURATION[interval];

    const durationLabel = `Duration: ${formatDate(period.start)} - ${formatDate(period.end)}`;
    const generatedOn = `Generated on ${new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    })}`;

    const url = req.headers.get('referer')!;
    const domain = req.headers.get('host')!;
    const cookies = req.cookies.getAll();

    browser = await getBrowser();
    const page = await browser.newPage();

    // Forward auth cookies so protected routes render correctly
    await browser.setCookie(
      ...cookies.map((cookie) => ({ ...cookie, domain })),
    );

    // A4 at 96dpi is ~794px; use 1200px so Chakra's md breakpoint (768px) is active
    await page.setViewport({ width: 1200, height: 900 });

    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#reports-dashboard');

    // Replace body content with only the dashboard grid — <head> stays intact
    // so all Chakra CSS variables and stylesheets remain active
    await page.evaluate(
      ({ durationLabel, generatedOn }) => {
        const grid = document.getElementById('reports-dashboard');
        if (!grid) return;

        const title = document.createElement('h1');
        title.id = 'pdf-title';
        title.textContent = `Analytics Overview Report `;

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
        #pdf-description { font-size: 13px; color: #666; }
        #reports-dashboard { grid-template-columns: repeat(2, 1fr) !important; }
      `,
    });

    const pageHeight = await page.evaluate(() => document.body.scrollHeight);

    const pdfBuffer = await page.pdf({
      width: '210mm',
      height: `${pageHeight}px`,
      printBackground: true,
      margin: {
        top: 20,
        right: 24,
        bottom: 20,
        left: 24,
      },
    });

    return new Response(Buffer.from(pdfBuffer));
  } catch (error) {
    return NextResponse.json(
      {
        error: devEnv
          ? (error as Error).message
          : 'Unable to generate the report. Please try again later',
      },
      { status: 500 },
    );
  } finally {
    await browser?.close();
  }
}
