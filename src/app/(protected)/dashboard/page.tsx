'use client';

import { LogoutButton } from '@/app/(auth)/_components/logout-button';
import useCurrentUser from '@/hooks/use-current-user';

export default function DashboardPage() {
  const user = useCurrentUser();

  return (
    <div>
      <h1>Dashboard</h1>
      <LogoutButton />
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
