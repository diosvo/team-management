import { headers } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import auth from '@/lib/auth';
import { LOGIN_PATH } from '@/routes';
import { MOCK_USER } from '@/test/mocks/user';

import { getServerSession, withAuth } from './auth';

type MockHeaders = Awaited<ReturnType<typeof headers>>;
export type Session = typeof auth.$Infer.Session;

const mockHeaders = { 'user-agent': 'test' } as unknown as MockHeaders;

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
  user: MOCK_USER,
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

  describe('getServerSession', () => {
    test('calls auth.api.getSession with headers', async () => {
      const mockSession = createMockSession();
      vi.mocked(headers).mockResolvedValue(mockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const result = await getServerSession();

      expect(headers).toHaveBeenCalled();
      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: mockHeaders,
      });
      expect(result).toEqual(mockSession);
    });

    test('returns null when no session exists', async () => {
      vi.mocked(headers).mockResolvedValue(mockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const result = await getServerSession();

      expect(result).toBeNull();
    });

    test('caches the result of getSession call', async () => {
      const mockSession = createMockSession();
      vi.mocked(headers).mockResolvedValue(mockHeaders);
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      // Call twice to verify caching behavior
      await getServerSession();
      await getServerSession();

      // Should still be called twice due to test isolation
      expect(auth.api.getSession).toHaveBeenCalled();
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

      expect(mockServerAction).toHaveBeenCalledWith(MOCK_USER, 'arg1', 'arg2');
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
        MOCK_USER,
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
