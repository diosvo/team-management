import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

import env from '@env';

import { getBrowser } from './puppeteer';

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
  default: { NODE_ENV: 'development', CHROMIUM_PACK_URL: undefined },
}));

describe('getBrowser', () => {
  const BROWSER = { id: 'browser' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(puppeteer.launch).mockResolvedValue(BROWSER as never);
    env.NODE_ENV = 'development';
    env.CHROMIUM_PACK_URL = undefined as never;
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
});
