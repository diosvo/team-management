import { rateLimitMessage } from './rate-limit';

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
