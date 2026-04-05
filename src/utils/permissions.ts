import { RESOURCES } from '@/routes';
import { UserRole } from '@/utils/enum';

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export type Action = (typeof ALL_ACTIONS)[number];
export type Resource = (typeof RESOURCES)[number];

/**
 * Each role defines which resources it can access and what actions it can perform.
 */
const PERMISSIONS: Record<
  UserRole,
  Partial<Record<Resource, Array<Action>>>
> = {
  // [UserRole.SUPER_ADMIN]: Object.fromEntries(
  //   RESOURCES.map((resource) => [resource, ALL_ACTIONS]),
  // ),
  [UserRole.SUPER_ADMIN]: {
    dashboard: ['view'],
    analytics: ['edit'],
    assets: ['view', 'create'],
    roster: ['view'],
  },
  [UserRole.COACH]: {
    dashboard: ['view'],
    analytics: ['view'],
    'team-rule': ['view'],
    roster: ['view'],
    training: ['view', 'create', 'edit'],
    attendance: ['view', 'create', 'edit'],
    registration: ['view'],
    matches: ['view', 'create', 'edit'],
    'periodic-testing': ['view'],
    assets: ['view'],
    leagues: ['view'],
    locations: ['view'],
  },
  [UserRole.PLAYER]: {
    dashboard: ['view'],
    analytics: ['view'],
    'team-rule': ['view'],
    roster: ['view'],
    training: ['view'],
    attendance: ['view'],
    matches: ['view'],
    'periodic-testing': ['view'],
  },
  [UserRole.GUEST]: {
    dashboard: ['view'],
    roster: ['view'],
    matches: ['view'],
  },
};

const CAPTAIN_PERMISSIONS: Partial<Record<Resource, Array<Action>>> = {
  'team-rule': ['edit'],
  roster: ['edit'],
  matches: ['create', 'edit'],
};

export type Permission = `${Resource}:${Action}`;

export type Ability = {
  can: (perm: Permission) => boolean;
  canAll: (perms: Array<Permission>) => boolean;
  canAny: (perms: Array<Permission>) => boolean;
};

export function can(
  role: UserRole,
  resource: Resource,
  action: Action,
  isCaptain?: boolean,
) {
  if (PERMISSIONS[role][resource]?.includes(action)) return true;
  if (role === UserRole.PLAYER && isCaptain) {
    return CAPTAIN_PERMISSIONS[resource]?.includes(action) ?? false;
  }
  return false;
}

// TODO: Could it be replaced by permissions map or defineAbility???
export function hasPermissions(role: UserRole) {
  return {
    isAdmin: role === UserRole.SUPER_ADMIN,
    isPlayer: role === UserRole.PLAYER,
    isCoach: role === UserRole.COACH,
    isGuest: role === UserRole.GUEST,
  };
}

/**
 * Creates an ability object bound to a specific role.
 *
 * @example
 * ```js
 *   const ability = defineAbility(UserRole.COACH);
 *   ability.can('roster:view'); // true
 * ```
 */
export function defineAbility(role: UserRole, isCaptain?: boolean): Ability {
  const _can = (perm: Permission) => {
    const [resource, action] = perm.split(':') as [Resource, Action];
    return can(role, resource, action, isCaptain);
  };

  return {
    can: _can,
    canAll: (perms) => perms.every(_can),
    canAny: (perms) => perms.some(_can),
  };
}
