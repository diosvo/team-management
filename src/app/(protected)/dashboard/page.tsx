import { LogoutButton } from '@/app/(auth)/_components/logout-button';
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1>Dashboard</h1>
      <LogoutButton />
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
