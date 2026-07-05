'use client';

import { createContext, useContext, useMemo } from 'react';

import type { User } from '@/drizzle/schema/user';
import type { UserRole } from '@/utils/enum';

import auth from '@/lib/auth';
import authClient from '@/lib/auth-client';

export type Session = Nullable<typeof auth.$Infer.Session>;

type SessionContextValue = {
  session: Session;
  user: Nullable<User>;
  role: Nullable<UserRole>;
  isCaptain: boolean;
  /** `true` only when we have no server session AND the client hook is still resolving. */
  isLoading: boolean;
  isAuthenticated: boolean;
};

const SessionContext = createContext<Nullable<SessionContextValue>>(null);

type SessionProviderProps = {
  /** Session resolved on the server via `auth.api.getSession()` */
  initialSession: Session;
  children: React.ReactNode;
};

export default function SessionProvider({
  initialSession,
  children,
}: SessionProviderProps) {
  // The client hook keeps the sessiom fresh after sign-in/out, token refresh, etc. Until it resolves, we trust the server value.
  const { data, isPending } = authClient.useSession();

  const value = useMemo<SessionContextValue>(() => {
    const session = data ?? (isPending ? initialSession : null);
    const user = (session?.user as User) ?? null;

    return {
      session,
      user,
      role: user?.role ?? null,
      isCaptain: user?.is_captain ?? false,
      isLoading: isPending && initialSession == null,
      isAuthenticated: !!session,
    };
  }, [data, isPending, initialSession]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error(
      'useSessionContext must be used within a <SessionProvider>',
    );
  return ctx;
}
