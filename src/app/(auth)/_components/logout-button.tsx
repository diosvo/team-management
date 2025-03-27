'use client';

import { useTransition } from 'react';

import { Button } from '@chakra-ui/react';

import { logout } from '@/features/user/actions/auth';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <Button onClick={handleLogout} loading={isPending}>
      Logout
    </Button>
  );
}
