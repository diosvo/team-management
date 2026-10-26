import { cookies, headers } from 'next/headers';

import en from './messages/en';
import requestConfig from './request';

vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }));

// `getRequestConfig` only tags the factory; call it directly.
vi.mock('next-intl/server', () => ({
  getRequestConfig: <T>(factory: T) => factory,
}));

type Config = { locale: string; messages: typeof en; timeZone: string };
const resolve = requestConfig as unknown as () => Promise<Config>;

describe('i18n request config', () => {
  const setup = ({
    cookie,
    language,
  }: Partial<{ cookie: string; language: string }> = {}) => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => (cookie ? { name: 'NEXT_LOCALE', value: cookie } : undefined),
    } as never);
    vi.mocked(headers).mockResolvedValue(
      new Headers(language ? { 'accept-language': language } : {}) as never,
    );
    return resolve();
  };

  test('defaults to English', async () => {
    const config = await setup();

    expect(config.locale).toBe('en');
    expect(config.messages).toBe(en);
    expect(config.timeZone).toBe('Asia/Ho_Chi_Minh');
  });

  test('uses the locale cookie', async () => {
    const config = await setup({ cookie: 'vi', language: 'en-US' });

    expect(config.locale).toBe('vi');
    expect(config.messages.common.save).toBe('Lưu');
  });

  test('prefers the cookie over the browser language', async () => {
    expect((await setup({ cookie: 'en', language: 'vi-VN' })).locale).toBe(
      'en',
    );
  });

  test.each(['vi', 'vi-VN,vi;q=0.9,en;q=0.8', 'VI'])(
    'falls back to Vietnamese browsers (%s)',
    async (language) => {
      expect((await setup({ language })).locale).toBe('vi');
    },
  );

  test('ignores an unsupported cookie', async () => {
    expect((await setup({ cookie: 'fr', language: 'en-GB' })).locale).toBe(
      'en',
    );
  });

  test('keeps every English namespace under Vietnamese', async () => {
    const { messages } = await setup({ cookie: 'vi' });

    expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
  });
});
