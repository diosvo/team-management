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

  return (
    <SessionProvider initialSession={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
