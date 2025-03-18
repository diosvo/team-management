'use client';

import { Button } from '@chakra-ui/react';
import { signOut } from 'next-auth/react';
import { useTransition } from 'react';

import { LOGIN_PATH } from '@/routes';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({
        redirectTo: LOGIN_PATH,
      });
    });
  };

  return (
    <Button onClick={handleLogout} loading={isPending}>
      Logout
    </Button>
  );
}
