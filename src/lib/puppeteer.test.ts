import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

import env from '@env';

import {
  browserCookies,
  getBrowser,
  renderOrigin,
  SYSTEM_CHROMIUM_ARGS,
} from './puppeteer';

vi.mock('puppeteer-core', () => ({
  default: { launch: vi.fn() },
}));

vi.mock('@sparticuz/chromium-min', () => ({
  default: {
    args: ['--no-sandbox'],
    executablePath: vi.fn(),
  },
}));

vi.mock('@env', () => ({
  default: {
    NODE_ENV: 'development',
    CHROMIUM_PACK_URL: undefined,
    CHROMIUM_PATH: '',
    RENDER_ORIGIN: undefined,
    DEV_URL: 'http://localhost:3000',
    PRODUCTION_URL: 'https://club.example',
  },
}));

describe('getBrowser', () => {
  const BROWSER = { id: 'browser' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(puppeteer.launch).mockResolvedValue(BROWSER as never);
    env.NODE_ENV = 'development';
    env.CHROMIUM_PACK_URL = undefined as never;
    env.CHROMIUM_PATH = '';
  });

  test('launches the system Chrome in development', async () => {
    const browser = await getBrowser();

    expect(browser).toBe(BROWSER);
    expect(puppeteer.launch).toHaveBeenCalledWith({
      channel: 'chrome',
      defaultViewport: null,
      headless: true,
    });
    expect(chromium.executablePath).not.toHaveBeenCalled();
  });

  test('launches the hosted Chromium pack in production', async () => {
    env.NODE_ENV = 'production';
    env.CHROMIUM_PACK_URL = 'https://cdn.example.com/chromium.tar.br' as never;
    vi.mocked(chromium.executablePath).mockResolvedValue('/tmp/chromium');

    const browser = await getBrowser();

    expect(browser).toBe(BROWSER);
    expect(chromium.executablePath).toHaveBeenCalledWith(
      'https://cdn.example.com/chromium.tar.br',
    );
    expect(puppeteer.launch).toHaveBeenCalledWith({
      args: ['--no-sandbox'],
      executablePath: '/tmp/chromium',
      defaultViewport: null,
      headless: true,
    });
  });

  test('throws when CHROMIUM_PACK_URL is missing in production', async () => {
    env.NODE_ENV = 'production';
    env.CHROMIUM_PACK_URL = undefined as never;

    await expect(getBrowser()).rejects.toThrow(
      'Missing CHROMIUM_PACK_URL for the chromium executable',
    );
    expect(puppeteer.launch).not.toHaveBeenCalled();
  });

  test('launches the system Chromium when CHROMIUM_PATH is set', async () => {
    env.NODE_ENV = 'production';
    env.CHROMIUM_PATH = '/usr/bin/chromium';

    const browser = await getBrowser();

    expect(browser).toBe(BROWSER);
    expect(puppeteer.launch).toHaveBeenCalledWith({
      args: SYSTEM_CHROMIUM_ARGS,
      executablePath: '/usr/bin/chromium',
      defaultViewport: null,
      headless: true,
    });
    expect(chromium.executablePath).not.toHaveBeenCalled();
  });
});

describe('renderOrigin', () => {
  afterEach(() => {
    env.RENDER_ORIGIN = undefined;
  });

  test('keeps a trusted request origin when RENDER_ORIGIN is unset', () => {
    expect(renderOrigin('https://club.example')).toBe('https://club.example');
    expect(renderOrigin('http://localhost:3000/')).toBe(
      'http://localhost:3000',
    );
  });

  test.each([
    'http://169.254.169.254',
    'https://club.example.attacker.test',
    'not a url',
  ])('falls back to PRODUCTION_URL for an untrusted origin (%s)', (origin) => {
    expect(renderOrigin(origin)).toBe('https://club.example');
  });

  test('uses RENDER_ORIGIN when set', () => {
    env.RENDER_ORIGIN = 'http://127.0.0.1:3000';

    expect(renderOrigin('https://club.example')).toBe('http://127.0.0.1:3000');
  });
});

describe('browserCookies', () => {
  const cookies = [
    { name: '__Secure-better-auth.session_token', value: 'a' },
    { name: 'NEXT_LOCALE', value: 'vi' },
  ];

  test('scopes cookies to the hostname and marks them secure on https', () => {
    expect(browserCookies(cookies, 'https://club.example')).toEqual([
      { ...cookies[0], domain: 'club.example', path: '/', secure: true },
      { ...cookies[1], domain: 'club.example', path: '/', secure: true },
    ]);
  });

  test('keeps __Secure- cookies secure on a plain-http local origin', () => {
    expect(browserCookies(cookies, 'http://127.0.0.1:3000')).toEqual([
      { ...cookies[0], domain: '127.0.0.1', path: '/', secure: true },
      { ...cookies[1], domain: '127.0.0.1', path: '/', secure: false },
    ]);
  });
});
