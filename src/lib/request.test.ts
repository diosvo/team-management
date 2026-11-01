import { isAuthorizedCron, requestOrigin } from './request';

vi.mock('@env', () => ({ default: { CRON_SECRET: 'secret-token' } }));

describe('isAuthorizedCron', () => {
  test('returns false when CRON_SECRET is not configured', async () => {
    vi.doMock('@env', () => ({ default: { CRON_SECRET: undefined } }));
    vi.resetModules();
    const { isAuthorizedCron: isAuthorizedCronNoSecret } = await import(
      './request'
    );

    const headers = new Headers({ authorization: 'Bearer secret-token' });

    expect(isAuthorizedCronNoSecret(headers)).toBe(false);

    vi.doUnmock('@env');
    vi.resetModules();
  });

  test('returns true for a matching bearer token', () => {
    const headers = new Headers({ authorization: 'Bearer secret-token' });

    expect(isAuthorizedCron(headers)).toBe(true);
  });

  test('returns false for a missing or mismatched token', () => {
    expect(isAuthorizedCron(new Headers())).toBe(false);
    expect(
      isAuthorizedCron(new Headers({ authorization: 'Bearer wrong' })),
    ).toBe(false);
  });
});

describe('requestOrigin', () => {
  test('returns null when the host header is missing', () => {
    expect(requestOrigin(new Headers())).toBeNull();
  });

  test('uses the origin header when present', () => {
    const headers = new Headers({
      host: 'example.com',
      origin: 'https://example.com',
    });

    expect(requestOrigin(headers)).toEqual({
      host: 'example.com',
      origin: 'https://example.com',
    });
  });

  test('falls back to http when there is no forwarded proto', () => {
    const headers = new Headers({ host: 'example.com' });

    expect(requestOrigin(headers)).toEqual({
      host: 'example.com',
      origin: 'http://example.com',
    });
  });

  test('honors x-forwarded-proto when the origin header is absent', () => {
    const headers = new Headers({
      host: 'example.com',
      'x-forwarded-proto': 'https',
    });

    expect(requestOrigin(headers)).toEqual({
      host: 'example.com',
      origin: 'https://example.com',
    });
  });
});
