import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

import env from '@env';

export async function getBrowser() {
  // Serverless/production: @sparticuz/chromium-min ships launch args but not the binary, so the headless Chromium is fetched from a hosted Brotli pack.
  if (env.NODE_ENV === 'production') {
    if (!env.CHROMIUM_PACK_URL) {
      throw new Error('Missing CHROMIUM_PACK_URL for the chromium executable');
    }

    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(env.CHROMIUM_PACK_URL),
      defaultViewport: null,
      headless: true,
    });
  }

  // Local development: drive the system-installed Chrome (no download needed).
  return puppeteer.launch({
    channel: 'chrome',
    defaultViewport: null,
    headless: true,
  });
}
