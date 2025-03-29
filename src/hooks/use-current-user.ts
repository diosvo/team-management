'use client';

import { useSession } from 'next-auth/react';

export default function useCurrentUser() {
  const session = useSession();

  return (
    session.data?.user ?? {
      id: 'anonymous',
      name: 'Anonymous',
      image: '/logo.png',
      roles: ['PLAYER'],
    }
  );
}
