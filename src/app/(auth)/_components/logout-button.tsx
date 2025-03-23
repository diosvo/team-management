'use client';

import { signOut } from 'next-auth/react';
import { useTransition } from 'react';

import { Button } from '@chakra-ui/react';

import { LOGIN_PATH } from '@/routes';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({
        redirectTo: LOGIN_PATH,
        redirect: true, // Reload the login page
      });
    });
  };

  return (
    <Button onClick={handleLogout} loading={isPending}>
      Logout
    </Button>
  );
}
