'use client';

import { useSession } from 'next-auth/react';

import { userRoles } from '@/drizzle/schema';

export default function useCurrentUser() {
  const session = useSession();

  return session.data
    ? session.data.user
    : {
        id: '',
        name: 'Anonymous',
        email: '',
        image: '',
        roles: [userRoles[4]],
        isOAuth: false,
      };
}
