'use client';

import { signIn } from 'next-auth/react';

import { Button } from '@chakra-ui/react';

export default function SignIn() {
  return (
    <Button onClick={() => signIn('google', { redirectTo: '/' })}>
      Sign in
    </Button>
  );
}
