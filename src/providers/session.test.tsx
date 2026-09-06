import type { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react';

import { setupTestLifecycle } from '@/test/utilities';

import { UserRole } from '@/utils/enum';

import type auth from '@/lib/auth';
import authClient from '@/lib/auth-client';

import SessionProvider, {
  useSessionContext,
  type SessionUser,
} from './session';

vi.mock('@/lib/auth-client', () => ({
  default: {
    useSession: vi.fn(),
  },
}));

const mockUseSession = vi.mocked(authClient.useSession);

/**
 * Builds a session-shaped object. The provider only reads `session.user`, so we
 * keep the payload minimal and cast.
 */
const buildSession = (user: Record<string, unknown> = {}) =>
  ({ session: {}, user }) as unknown as typeof auth.$Infer.Session;

/** Builds the user projection the server layout serializes. */
const buildUser = (user: Record<string, unknown> = {}): SessionUser =>
  user as unknown as SessionUser;

type SessionStore = ReturnType<typeof authClient.useSession>;

/**
 * Drives the client hook. The provider only reads `data` and `isPending`, so
 * the rest of the store is filled with inert values to satisfy its return type.
 */
const mockSessionStore = (store: Partial<SessionStore>) =>
  mockUseSession.mockReturnValue({
    data: null,
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: vi.fn(),
    ...store,
  } as SessionStore);

const renderProvider = (initialUser: Nullable<SessionUser>) =>
  renderHook(() => useSessionContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
    ),
  });

describe('SessionProvider', () => {
  setupTestLifecycle();

  describe('useSessionContext', () => {
    test('throws when used outside of a <SessionProvider>', () => {
      // Silence the expected React error boundary logging.
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useSessionContext())).toThrow(
        'useSessionContext must be used within a <SessionProvider>',
      );

      spy.mockRestore();
    });
  });

  describe('client session resolved', () => {
    test('exposes the user from the client session', () => {
      mockSessionStore({
        data: buildSession({ role: UserRole.COACH, is_captain: true }),
        isPending: false,
      });

      const { result } = renderProvider(null);

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toMatchObject({
        role: UserRole.COACH,
        is_captain: true,
      });
    });

    test('client session takes precedence over the server user', () => {
      const initialUser = buildUser({ role: UserRole.GUEST });
      mockSessionStore({
        data: buildSession({ role: UserRole.SUPER_ADMIN }),
        isPending: false,
      });

      const { result } = renderProvider(initialUser);

      expect(result.current.user?.role).toBe(UserRole.SUPER_ADMIN);
    });
  });

  describe('while the client hook is pending', () => {
    test('falls back to the server user', () => {
      const initialUser = buildUser({ role: UserRole.PLAYER });
      mockSessionStore({ data: null, isPending: true });

      const { result } = renderProvider(initialUser);

      expect(result.current.user).toBe(initialUser);
      expect(result.current.isAuthenticated).toBe(true);
      // We have a server user, so we are not "loading".
      expect(result.current.isLoading).toBe(false);
    });

    test('is loading when there is no server user to fall back to', () => {
      mockSessionStore({ data: null, isPending: true });

      const { result } = renderProvider(null);

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('no session', () => {
    test('resolves to an unauthenticated, non-loading state', () => {
      mockSessionStore({ data: null, isPending: false });

      const { result } = renderProvider(null);

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    test('ignores the server user once the client hook resolves empty', () => {
      const initialUser = buildUser({ role: UserRole.SUPER_ADMIN });
      mockSessionStore({ data: null, isPending: false });

      const { result } = renderProvider(initialUser);

      // Client resolved to "no session" (e.g. after sign-out), so we drop the
      // stale server value instead of trusting it.
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
