'use client';

import { createContext, use, useMemo } from 'react';

import type auth from '@/lib/auth';
import authClient from '@/lib/auth-client';

export type SessionUser = typeof auth.$Infer.Session.user;

export type SessionContextValue = {
  user: Nullable<SessionUser>;
  /** `true` only when we have no server user AND the client hook is still resolving. */
  isLoading: boolean;
  isAuthenticated: boolean;
};

const SessionContext = createContext<Nullable<SessionContextValue>>(null);

type SessionProviderProps = {
  initialUser: Nullable<SessionUser>;
  children: React.ReactNode;
};

export default function SessionProvider({
  initialUser,
  children,
}: SessionProviderProps) {
  // The client hook keeps the session fresh after sign-in/out, token refresh, etc. Until it resolves, we trust the server value.
  const { data, isPending } = authClient.useSession();

  const value = useMemo<SessionContextValue>(() => {
    const session = data ?? null;
    const user: Nullable<SessionUser> = session
      ? session.user
      : isPending
        ? initialUser
        : null;

    return {
      user,
      isLoading: isPending && initialUser == null,
      isAuthenticated: !!user,
    };
  }, [data, isPending, initialUser]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSessionContext() {
  const ctx = use(SessionContext);
  if (!ctx)
    throw new Error(
      'useSessionContext must be used within a <SessionProvider>',
    );
  return ctx;
}
