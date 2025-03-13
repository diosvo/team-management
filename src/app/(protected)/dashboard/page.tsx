import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(session)}</pre>
    </div>
  );
}
