'use client';

import { UserRole } from '@/utils/enum';
import { hasPermissions } from '@/utils/helper';

/**
 * @description Hook to determine the current user permissions based on their role.
 */
export function usePermissions() {
  // FIXME: It cause "Unexpected Fiber popped." when refreshing page with nuqs
  // const { data, isPending } = authClient.useSession();

  // if (isPending || !data?.session) {
  //   return {
  //     isAdmin: false,
  //     isPlayer: false,
  //     isCoach: false,
  //     isGuest: false,
  //   };
  // }

  // return hasPermissions(data.user.role as UserRole);
  return hasPermissions(UserRole.SUPER_ADMIN); // <- FIXME: Temporary hardcode
}
