'use client';

import { useEffect, useMemo, useState } from 'react';

import authClient from '@/lib/auth-client';
import { UserRole } from '@/utils/enum';
import {
  defineAbility,
  hasPermissions,
  type Action,
  type Permission,
  type Resource,
} from '@/utils/permissions';

import { User } from '@/drizzle/schema';

const DEFAULT_PERMISSIONS = {
  isAdmin: false,
  isPlayer: false,
  isCoach: false,
  isGuest: false,
  can: (_resource: Resource, _action: Action) => false,
  canAll: (_perms: Array<Permission>) => false,
  canAny: (_perms: Array<Permission>) => false,
} as const;

export default function usePermissions() {
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only execution
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isPending } = authClient.useSession();
  const user = data?.user as User;
  const role = user?.role as UserRole;
  const ready = mounted && !isPending && !!data?.session && !!role;

  return useMemo(() => {
    // Return default permissions during SSR or while mounting
    if (!ready || !role) return DEFAULT_PERMISSIONS;

    const ability = defineAbility(role, user?.is_captain);

    return {
      ...hasPermissions(role),
      can: (resource: Resource, action: Action) =>
        ability.can(`${resource}:${action}`),
      canAll: ability.canAll,
      canAny: ability.canAny,
    };
  }, [ready, role]);
}
