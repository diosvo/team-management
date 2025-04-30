import { use, useMemo } from 'react';

import { UserRole } from '@/utils/enum';
import { useUser } from './use-user';

export function usePermissions(
  roles: Array<UserRole> = [UserRole.SUPER_ADMIN]
): boolean {
  const { userPromise } = useUser();
  const user = use(userPromise);

  return useMemo(() => {
    if (!user) return false;
    return roles.some((role) => user.roles.includes(role));
  }, [user, roles]);
}
