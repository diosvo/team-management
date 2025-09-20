'use client';

import authClient from '@/lib/auth-client';
import { UserRole } from '@/utils/enum';
import { hasPermissions } from '@/utils/helper';

/**
 * @description Hook to determine the current user permissions based on their role.
 */
export function usePermissions() {
  const { data } = authClient.useSession();

  if (!data?.session) {
    return {
      isAdmin: false,
      isPlayer: false,
      isCoach: false,
      isGuest: false,
    };
  }
  return hasPermissions(data.user.role as UserRole);
}
