'use client';

import { useSession } from 'next-auth/react';
import { ExtendedUser } from '../../next-auth';

export default function useCurrentUser() {
  const session = useSession();

  return session.data!.user as Required<ExtendedUser>;
}
