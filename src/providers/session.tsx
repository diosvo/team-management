'use client';

import { createContext, use, useMemo } from 'react';

import type { User } from '@/drizzle/schema/user';
import type { UserRole } from '@/utils/enum';

import type auth from '@/lib/auth';
import authClient from '@/lib/auth-client';

export type Session = Nullable<typeof auth.$Infer.Session>;

/**
 * The subset of the user row the server layout is allowed to serialize.
 * Keep this narrow — everything here is embedded in the initial HTML payload,
 * so the session token and other sensitive fields must never be added.
 */
export type SessionUser = Pick<
  User,
  | 'id'
  | 'name'
  | 'email'
  | 'image'
  | 'role'
  | 'state'
  | 'team_id'
  | 'is_captain'
>;

type SessionContextValue = {
  session: Session;
  user: Nullable<User>;
  role: Nullable<UserRole>;
  isCaptain: boolean;
  /** `true` only when we have no server user AND the client hook is still resolving. */
  isLoading: boolean;
  isAuthenticated: boolean;
};

const SessionContext = createContext<Nullable<SessionContextValue>>(null);

type SessionProviderProps = {
  /** Narrow user projection resolved on the server via `auth.api.getSession()` */
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
    const user = (session?.user ??
      (isPending ? initialUser : null)) as Nullable<User>;

    return {
      session,
      user,
      role: user?.role ?? null,
      isCaptain: user?.is_captain ?? false,
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
