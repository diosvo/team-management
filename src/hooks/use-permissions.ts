'use client';

import { useMemo } from 'react';

import { hasPermissions } from '@/utils/helper';
import { useCurrentUser } from './use-user';

/**
 * @description Hook to determine the current user permissions based on their role.
 */
export function usePermissions() {
  const user = useCurrentUser();

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
