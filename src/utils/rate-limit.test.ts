import { createTranslator } from 'next-intl';

import { MESSAGES } from '@/test/utilities';

import { authErrorMessage, rateLimitMessage } from './rate-limit';

const GENERIC = 'Rate limit exceeded. Please try again later.';

describe('rateLimitMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders the retry time from `X-Retry-After`', () => {
    const headers = new Headers({ 'X-Retry-After': '60' });

    expect(rateLimitMessage(headers)).toBe(
      'Rate limit exceeded. Retry at 10:01:00',
    );
  });

  test('falls back to the standard `Retry-After` header', () => {
    const headers = new Headers({ 'Retry-After': '90' });

    expect(rateLimitMessage(headers)).toBe(
      'Rate limit exceeded. Retry at 10:01:30',
    );
  });

  test('prefers `X-Retry-After` when both headers are present', () => {
    const headers = new Headers({
      'X-Retry-After': '30',
      'Retry-After': '600',
    });

    expect(rateLimitMessage(headers)).toBe(
      'Rate limit exceeded. Retry at 10:00:30',
    );
  });

  test.each([
    ['no header is sent', {}],
    ['the header is not a number', { 'X-Retry-After': 'later' }],
    // The standard header also allows an HTTP date, which we cannot parse.
    [
      'the header is an HTTP date',
      { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' },
    ],
    ['the window has already elapsed', { 'X-Retry-After': '0' }],
    ['the header is negative', { 'X-Retry-After': '-10' }],
  ])('omits the time when %s', (_, headers) => {
    expect(rateLimitMessage(new Headers(headers))).toBe(GENERIC);
  });
});

describe('authErrorMessage', () => {
  const t = (locale: 'en' | 'vi') =>
    createTranslator({
      locale,
      messages: MESSAGES[locale],
      namespace: 'auth.errors',
    });

  const context = (
    error: { code?: string; message?: string; statusText?: string },
    status = 401,
    headers: Record<string, string> = {},
  ) => ({ error, response: { status, headers: new Headers(headers) } });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('translates a known better-auth error code', () => {
    const error = context({
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Invalid email or password',
    });

    expect(authErrorMessage(error, t('vi'))).toBe(
      'Email hoặc mật khẩu không đúng.',
    );
  });

  test("keeps the server's message for an unknown code", () => {
    const error = context({ code: 'SOMETHING_NEW', message: 'Server says no' });

    expect(authErrorMessage(error, t('vi'))).toBe('Server says no');
  });

  test('falls back to the generic message', () => {
    expect(authErrorMessage(context({}), t('vi'))).toBe('Đã có lỗi xảy ra.');
    expect(authErrorMessage(context({}))).toBe('Something went wrong.');
  });

  test('localizes the rate limit with its retry time', () => {
    const error = context({}, 429, { 'X-Retry-After': '60' });

    expect(authErrorMessage(error, t('vi'))).toBe(
      'Bạn thử quá nhiều lần. Vui lòng thử lại lúc 10:01:00.',
    );
    expect(authErrorMessage(error, t('en'))).toBe(
      'Rate limit exceeded. Retry at 10:01:00',
    );
  });

  test('localizes the rate limit without a retry time', () => {
    expect(authErrorMessage(context({}, 429), t('vi'))).toBe(
      'Bạn thử quá nhiều lần. Vui lòng thử lại sau.',
    );
  });
});
