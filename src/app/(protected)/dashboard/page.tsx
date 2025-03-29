'use client';

import { LogoutButton } from '@/app/(auth)/_components/logout-button';

import useCurrentUser from '@/hooks/use-current-user';
import useRoles from '@/hooks/use-roles';

export default function DashboardPage() {
  const user = useCurrentUser();
  const roles = useRoles();

  return (
    <div>
      <h1>Dashboard</h1>
      <LogoutButton />
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <pre>{JSON.stringify(roles, null, 2)}</pre>
    </div>
  );
}
