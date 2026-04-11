import { UserRole } from './enum';
import { can, defineAbility, hasPermissions } from './permissions';

describe('can', () => {
  const cases = [
    // SUPER_ADMIN has all permissions
    {
      role: UserRole.SUPER_ADMIN,
      resource: 'roster',
      action: 'delete',
      isCaptain: false,
      expected: true,
    },
    // COACH allowed actions
    {
      role: UserRole.COACH,
      resource: 'training',
      action: 'create',
      isCaptain: false,
      expected: true,
    },
    {
      role: UserRole.COACH,
      resource: 'training',
      action: 'delete',
      isCaptain: false,
      expected: false,
    },
    // PLAYER base permissions
    {
      role: UserRole.PLAYER,
      resource: 'matches',
      action: 'view',
      isCaptain: false,
      expected: true,
    },
    {
      role: UserRole.PLAYER,
      resource: 'matches',
      action: 'create',
      isCaptain: false,
      expected: false,
    },
    // PLAYER as captain gets extra permissions
    {
      role: UserRole.PLAYER,
      resource: 'matches',
      action: 'create',
      isCaptain: true,
      expected: true,
    },
    {
      role: UserRole.PLAYER,
      resource: 'roster',
      action: 'edit',
      isCaptain: true,
      expected: true,
    },
    {
      role: UserRole.PLAYER,
      resource: 'roster',
      action: 'delete',
      isCaptain: true,
      expected: false,
    },
    // GUEST limited to view on specific resources
    {
      role: UserRole.GUEST,
      resource: 'dashboard',
      action: 'view',
      isCaptain: false,
      expected: true,
    },
    {
      role: UserRole.GUEST,
      resource: 'dashboard',
      action: 'edit',
      isCaptain: false,
      expected: false,
    },
    {
      role: UserRole.GUEST,
      resource: 'training',
      action: 'view',
      isCaptain: false,
      expected: false,
    },
  ] as const;

  test.each(cases)(
    '$role $resource:$action (captain=$isCaptain) → $expected',
    ({ role, resource, action, isCaptain, expected }) => {
      expect(can(role, resource, action, isCaptain)).toBe(expected);
    },
  );
});

describe('hasPermissions', () => {
  const cases = [
    {
      role: UserRole.SUPER_ADMIN,
      expected: {
        isAdmin: true,
        isPlayer: false,
        isCoach: false,
        isGuest: false,
      },
    },
    {
      role: UserRole.COACH,
      expected: {
        isAdmin: false,
        isPlayer: false,
        isCoach: true,
        isGuest: false,
      },
    },
    {
      role: UserRole.PLAYER,
      expected: {
        isAdmin: false,
        isPlayer: true,
        isCoach: false,
        isGuest: false,
      },
    },
    {
      role: UserRole.GUEST,
      expected: {
        isAdmin: false,
        isPlayer: false,
        isCoach: false,
        isGuest: true,
      },
    },
  ];

  test.each(cases)('returns correct flags for $role', ({ role, expected }) => {
    expect(hasPermissions(role)).toEqual(expected);
  });
});

describe('defineAbility', () => {
  describe('can', () => {
    test('returns true for allowed permission', () => {
      expect(defineAbility(UserRole.COACH).can('roster:view')).toBe(true);
    });

    test('returns false for denied permission', () => {
      expect(defineAbility(UserRole.COACH).can('roster:delete')).toBe(false);
    });

    test('respects captain flag', () => {
      expect(defineAbility(UserRole.PLAYER, true).can('matches:create')).toBe(
        true,
      );
      expect(defineAbility(UserRole.PLAYER, false).can('matches:create')).toBe(
        false,
      );
    });
  });

  describe('canAll', () => {
    test('returns true when all permissions are granted', () => {
      expect(
        defineAbility(UserRole.COACH).canAll([
          'training:view',
          'training:create',
        ]),
      ).toBe(true);
    });

    test('returns false when any permission is denied', () => {
      expect(
        defineAbility(UserRole.COACH).canAll([
          'training:view',
          'training:delete',
        ]),
      ).toBe(false);
    });
  });

  describe('canAny', () => {
    test('returns true when at least one permission is granted', () => {
      expect(
        defineAbility(UserRole.GUEST).canAny([
          'dashboard:view',
          'dashboard:edit',
        ]),
      ).toBe(true);
    });

    test('returns false when no permissions are granted', () => {
      expect(
        defineAbility(UserRole.GUEST).canAny([
          'training:view',
          'training:create',
        ]),
      ).toBe(false);
    });
  });
});
