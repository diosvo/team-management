'use client';

import { Button } from '@chakra-ui/react';

import { logout } from '@/features/user/actions/auth';

export default function DashboardPage() {
  // const session = await auth();

  return (
    <div>
      <h1>Dashboard</h1>
      <Button onClick={() => logout()}>Logout</Button>
      {/* <pre>{JSON.stringify(session)}</pre> */}
    </div>
  );
}
