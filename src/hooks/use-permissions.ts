'use client';

import { useMemo } from 'react';

import {
  defineAbility,
  hasPermissions,
  type Action,
  type Permission,
  type Resource,
} from '@/utils/permissions';

import { useSessionContext } from '@/providers/session';

export type PermissionsResult = {
  isLoading: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  isCoach: boolean;
  isGuest: boolean;
  isCaptain: boolean;
  can: (resource: Resource, action: Action) => boolean;
  canAll: (perms: Array<Permission>) => boolean;
  canAny: (perms: Array<Permission>) => boolean;
};

const NO_ACCESS: Omit<PermissionsResult, 'isLoading'> = {
  isAdmin: false,
  isPlayer: false,
  isCoach: false,
  isGuest: false,
  isCaptain: false,
  can: () => false,
  canAll: () => false,
  canAny: () => false,
} as const;

export default function usePermissions() {
  const { role, isCaptain, isLoading } = useSessionContext();

  return useMemo(() => {
    if (!role) return { isLoading, ...NO_ACCESS };

    const ability = defineAbility(role, isCaptain);

    return {
      isLoading: false,
      ...hasPermissions(role),
      isCaptain,
      can: (resource: Resource, action: Action) =>
        ability.can(`${resource}:${action}`),
      canAll: ability.canAll,
      canAny: ability.canAny,
    };
  }, [role, isCaptain, isLoading]);
}
