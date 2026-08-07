import { redirect, RedirectType } from 'next/navigation';

import { verifySession } from '@/actions/auth';
import type { User } from '@/drizzle/schema/user';
import SessionProvider, { type SessionUser } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';

import AppShell from './_components/AppShell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  if (!session) {
    redirect(LOGIN_PATH, RedirectType.replace);
  }

  // Serialize only what the client shell needs — never the session token.
  const { id, name, email, image, role, state, team_id, is_captain } =
    session.user as User;
  const initialUser: SessionUser = {
    id,
    name,
    email,
    image,
    role,
    state,
    team_id,
    is_captain,
  };

  return (
    <SessionProvider initialUser={initialUser}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
