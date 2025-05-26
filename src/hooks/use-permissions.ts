'use client';

import { use, useMemo } from 'react';

import { hasPermissions } from '@/utils/helper';
import { useUser } from './use-user';

/**
 * @description Hook to determine the current user permissions based on their role.
 */
export function usePermissions() {
  const { userPromise } = useUser();
  const user = use(userPromise);

  return useMemo(() => {
    if (!user) {
      return {
        isAdmin: false,
        isPlayer: false,
        isCoach: false,
        isGuest: false,
      };
    }
    return hasPermissions(user.role);
  }, [user]);
}
