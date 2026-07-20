import { getCookieCache, getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';
import { UserRole } from '@/utils/enum';

import { MOCK_USER } from '@/test/mocks/user';
import env from '@env';

import proxy from './proxy';

vi.mock('better-auth/cookies', () => ({
  getSessionCookie: vi.fn(),
  getCookieCache: vi.fn(),
}));

const mockGetSessionCookie = vi.mocked(getSessionCookie);
const mockGetCookieCache = vi.mocked(getCookieCache);

const ORIGIN = env.DEV_URL;

function buildRequest(
  pathname: string,
  { nextAction = false, cookies = [] as Array<{ name: string }> } = {},
) {
  const headers = new Headers();
  if (nextAction) headers.set('next-action', '1');

  return {
    headers,
    nextUrl: new URL(`${ORIGIN}${pathname}`),
    cookies: { getAll: () => cookies },
  } as unknown as NextRequest;
}

/** Absolute `Location` header → pathname, or `null` when the request passed through. */
function redirectPath(response: NextResponse) {
  const location = response.headers.get('location');
  return location ? new URL(location).pathname : null;
}

/** Simulate a present (`token`) or absent (`null`) `sgr.session_token` cookie. */
function withSessionToken(present: boolean) {
  mockGetSessionCookie.mockReturnValue(present ? 'signed-token' : null);
}

/** Simulate the signed `sgr.session_data` cache resolving to a session, or failing. */
function withSessionCache(role: UserRole | null) {
  mockGetCookieCache.mockResolvedValue(
    role
      ? {
          session: {
            id: 'test-session-id',
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(),
            token: 'test-token',
            userId: 'test-user-id',
          },
          user: MOCK_USER,
          updatedAt: Date.now(),
        }
      : null,
  );
}

describe('proxy middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withSessionToken(false);
  });

  test('skips auth entirely for server actions (next-action header)', async () => {
    const response = await proxy(
      buildRequest(DEFAULT_LOGIN_REDIRECT, { nextAction: true }),
    );

    expect(redirectPath(response)).toBeNull();
    // Returns before reading any cookie.
    expect(mockGetSessionCookie).not.toHaveBeenCalled();
    expect(mockGetCookieCache).not.toHaveBeenCalled();
  });

  describe('unauthenticated (no session_token)', () => {
    test('redirects a protected route to /login', async () => {
      const response = await proxy(buildRequest(DEFAULT_LOGIN_REDIRECT));

      expect(redirectPath(response)).toBe(LOGIN_PATH);
    });

    test('lets a public auth route render (/login)', async () => {
      const response = await proxy(buildRequest(LOGIN_PATH));

      expect(redirectPath(response)).toBeNull();
    });

    test('lets /forgot-password render', async () => {
      const response = await proxy(buildRequest('/forgot-password'));

      expect(redirectPath(response)).toBeNull();
    });
  });

  describe('authenticated (session_token present)', () => {
    beforeEach(() => {
      withSessionToken(true);
    });

    test('redirects an auth route (/login) to the dashboard', async () => {
      const response = await proxy(buildRequest(LOGIN_PATH));

      expect(redirectPath(response)).toBe(DEFAULT_LOGIN_REDIRECT);
      // Fast path: never validates the cache.
      expect(mockGetCookieCache).not.toHaveBeenCalled();
    });

    test('redirects the root (/) to the dashboard', async () => {
      const response = await proxy(buildRequest('/'));

      expect(redirectPath(response)).toBe(DEFAULT_LOGIN_REDIRECT);
    });

    describe('protected route', () => {
      test('redirects to /login when the session cache is unverifiable', async () => {
        // token cookie present + cache null → the ERR_TOO_MANY_REDIRECTS loop.
        // Current behavior redirects without clearing the stale cookie.
        withSessionCache(null);

        const response = await proxy(buildRequest(DEFAULT_LOGIN_REDIRECT));

        expect(redirectPath(response)).toBe(LOGIN_PATH);
      });

      test('allows access when the role can view the resource', async () => {
        withSessionCache(UserRole.GUEST); // GUEST can view dashboard

        const response = await proxy(buildRequest(DEFAULT_LOGIN_REDIRECT));

        expect(redirectPath(response)).toBeNull();
      });

      test('redirects to /forbidden when the role cannot view the resource', async () => {
        withSessionCache(UserRole.GUEST); // GUEST has no `emails` access

        const response = await proxy(buildRequest('/emails'));

        expect(redirectPath(response)).toBe('/forbidden');
      });

      test('resolves nested paths to their resource via prefix match', async () => {
        withSessionCache(UserRole.PLAYER); // PLAYER can view periodic-testing

        const response = await proxy(
          buildRequest('/periodic-testing/add-result'),
        );

        expect(redirectPath(response)).toBeNull();
      });

      test('applies the resource check to nested paths of a forbidden resource', async () => {
        withSessionCache(UserRole.GUEST); // GUEST has no `emails` access

        const response = await proxy(buildRequest('/emails/compose'));

        expect(redirectPath(response)).toBe('/forbidden');
      });

      test('allows protected paths that map to no known resource', async () => {
        withSessionCache(UserRole.GUEST);

        const response = await proxy(buildRequest('/settings'));

        expect(redirectPath(response)).toBeNull();
      });

      test('grants SUPER_ADMIN access to any resource', async () => {
        withSessionCache(UserRole.SUPER_ADMIN);

        const response = await proxy(buildRequest('/teams'));

        expect(redirectPath(response)).toBeNull();
      });
    });
  });
});
