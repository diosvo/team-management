'use client';

import { use, useMemo } from 'react';

import { UserRole } from '@/utils/enum';
import { useUser } from './use-user';

export function usePermissions() {
  const { userPromise } = useUser();
  const user = use(userPromise);

  return useMemo(() => {
    if (!user) {
      return {
        isAdmin: false,
        isPlayer: false,
        isCoach: false,
      };
    }

    const roles = user.roles;

    return {
      isAdmin: roles.includes(UserRole.SUPER_ADMIN),
      isPlayer: [UserRole.PLAYER, UserRole.CAPTAIN].some((role) =>
        roles.includes(role)
      ),
      isCoach: roles.includes(UserRole.COACH),
    };
  }, [user]);
}
