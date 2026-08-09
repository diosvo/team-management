import { redirect, RedirectType } from 'next/navigation';

import { verifySession } from '@/actions/auth';
import SessionProvider from '@/providers/session';
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

  // Only `session.user` crosses to the client — the session token stays server-side.
  return (
    <SessionProvider initialUser={session.user}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
