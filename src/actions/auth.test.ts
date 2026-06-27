import { headers } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import auth from '@/lib/auth';
import { LOGIN_PATH } from '@/routes';
import { MOCK_PLAYER, MOCK_USER } from '@/test/mocks/user';

import { verifySession, withAuth } from './auth';

type MockHeaders = Awaited<ReturnType<typeof headers>>;
export type Session = typeof auth.$Infer.Session;

const createMockSession = (): Session => ({
  session: {
    id: 'session-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: MOCK_USER.id,
    expiresAt: new Date(Date.now() + 60000),
    token: 'test-token',
    ipAddress: null,
    userAgent: 'vitest',
  },
  user: {
    ...MOCK_USER,
    ...MOCK_PLAYER,
  },
});

vi.mock('@/lib/auth', () => ({
  default: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifySession', () => {
    test('returns the session when it exists', async () => {
      const mockSession = createMockSession();
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      await expect(verifySession()).resolves.toEqual(mockSession);
    });

    test('returns null when no session exists', async () => {
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(verifySession()).resolves.toBeNull();
    });

    test('returns null when session exists but user is missing', async () => {
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue({
        ...createMockSession(),
        user: undefined,
      } as never);

      await expect(verifySession()).resolves.toBeNull();
    });
  });

  describe('withAuth', () => {
    test('calls server action with user when session exists', async () => {
      const mockSession = createMockSession();
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const mockServerAction = vi.fn().mockResolvedValue({ success: true });
      const wrappedAction = withAuth(mockServerAction);

      const result = await wrappedAction('arg1', 'arg2');

      expect(mockServerAction).toHaveBeenCalledWith(
        { ...MOCK_USER, ...MOCK_PLAYER },
        'arg1',
        'arg2',
      );
      expect(result).toEqual({ success: true });
      expect(redirect).not.toHaveBeenCalled();
    });

    test('redirects to login when no session exists', async () => {
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const mockServerAction = vi.fn();
      const wrappedAction = withAuth(mockServerAction);

      await expect(wrappedAction()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockServerAction).not.toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith(LOGIN_PATH, RedirectType.replace);
    });

    test('redirects to login when session exists but user is missing', async () => {
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const mockServerAction = vi.fn();
      const wrappedAction = withAuth(mockServerAction);

      await expect(wrappedAction()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockServerAction).not.toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith(LOGIN_PATH, RedirectType.replace);
    });

    test('passes through return value from server action', async () => {
      const mockSession = createMockSession();
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const expectedResult = { data: 'test', count: 42 };
      const mockServerAction = vi.fn().mockResolvedValue(expectedResult);
      const wrappedAction = withAuth(mockServerAction);

      const result = await wrappedAction();

      expect(result).toEqual(expectedResult);
    });

    test('passes through multiple arguments of different types', async () => {
      const mockSession = createMockSession();
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const mockServerAction = vi.fn().mockResolvedValue('success');
      const wrappedAction = withAuth(mockServerAction);

      const arg1 = 'string-arg';
      const arg2 = 123;
      const arg3 = { key: 'value' };
      const arg4 = ['array', 'items'];

      await wrappedAction(arg1, arg2, arg3, arg4);

      expect(mockServerAction).toHaveBeenCalledWith(
        { ...MOCK_USER, ...MOCK_PLAYER },
        arg1,
        arg2,
        arg3,
        arg4,
      );
    });

    test('propagates errors from server action', async () => {
      const mockSession = createMockSession();
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const error = new Error('Server action failed');
      const mockServerAction = vi.fn().mockRejectedValue(error);
      const wrappedAction = withAuth(mockServerAction);

      await expect(wrappedAction()).rejects.toThrow('Server action failed');
    });

    test('handles session check error gracefully', async () => {
      vi.mocked(headers).mockResolvedValue({} as MockHeaders);
      vi.mocked(auth.api.getSession).mockRejectedValue(
        new Error('Session fetch failed'),
      );

      const mockServerAction = vi.fn();
      const wrappedAction = withAuth(mockServerAction);

      await expect(wrappedAction()).rejects.toThrow('Session fetch failed');
      expect(mockServerAction).not.toHaveBeenCalled();
    });
  });
});
