import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

import env from '@env';

/**
 * Flags for a system Chromium inside a container:
 * - no setuid sandbox (the container is the boundary)
 * - no reliance on a small /dev/shm
 */
export const SYSTEM_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

export async function getBrowser() {
  // VPS/Docker: drive the Chromium installed in the image.
  if (env.CHROMIUM_PATH) {
    return puppeteer.launch({
      args: SYSTEM_CHROMIUM_ARGS,
      executablePath: env.CHROMIUM_PATH,
      defaultViewport: null,
      headless: true,
    });
  }

  // Serverless/production: chromium-min ships args only; the binary comes from a hosted pack.
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

  // Local development: drive the installed Chrome.
  return puppeteer.launch({
    channel: 'chrome',
    defaultViewport: null,
    headless: true,
  });
}

/** Normalized origin of a URL, or null when it doesn't parse. */
function originOf(url: string): Nullable<string> {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Where the headless browser loads app pages:
 * - `RENDER_ORIGIN` (VPS): the app directly, so the proxy's country filter
 *   doesn't block the server's own public IP
 * - the request origin, only if it's `DEV_URL` / `PRODUCTION_URL` (it comes
 *   from client headers and the browser carries session cookies → SSRF)
 * - otherwise `PRODUCTION_URL`
 */
export function renderOrigin(origin: string): string {
  if (env.RENDER_ORIGIN) return env.RENDER_ORIGIN;

  const requested = originOf(origin);
  const trusted = [env.DEV_URL, env.PRODUCTION_URL].map(originOf);

  return requested && trusted.includes(requested)
    ? requested
    : new URL(env.PRODUCTION_URL).origin;
}

/**
 * The caller's cookies as browser cookies for `origin`:
 * - request cookies carry only name and value
 * - `__Secure-` / `__Host-` names must be `secure`, which Chrome allows on
 *   http://127.0.0.1 and localhost
 */
export function browserCookies(
  cookies: Array<{ name: string; value: string }>,
  origin: string,
) {
  const { hostname, protocol } = new URL(origin);

  return cookies.map(({ name, value }) => ({
    name,
    value,
    domain: hostname,
    path: '/',
    secure: protocol === 'https:' || /^__(Secure|Host)-/.test(name),
  }));
}
