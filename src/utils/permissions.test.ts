import { UserRole } from '@/utils/enum';
import { can, defineAbility, hasPermissions } from './permissions';

describe('permissions', () => {
  describe('can()', () => {
    test('SUPER_ADMIN has full CRUD on roster', () => {
      expect(can(UserRole.SUPER_ADMIN, 'roster', 'view')).toBe(true);
      expect(can(UserRole.SUPER_ADMIN, 'roster', 'create')).toBe(true);
      expect(can(UserRole.SUPER_ADMIN, 'roster', 'edit')).toBe(true);
      expect(can(UserRole.SUPER_ADMIN, 'roster', 'delete')).toBe(true);
    });

    test('COACH can view roster but not create/edit/delete', () => {
      expect(can(UserRole.COACH, 'roster', 'view')).toBe(true);
      expect(can(UserRole.COACH, 'roster', 'create')).toBe(false);
      expect(can(UserRole.COACH, 'roster', 'edit')).toBe(false);
      expect(can(UserRole.COACH, 'roster', 'delete')).toBe(false);
    });

    test('COACH can create/edit training', () => {
      expect(can(UserRole.COACH, 'training', 'view')).toBe(true);
      expect(can(UserRole.COACH, 'training', 'create')).toBe(true);
      expect(can(UserRole.COACH, 'training', 'edit')).toBe(true);
      expect(can(UserRole.COACH, 'training', 'delete')).toBe(false);
    });

    test('PLAYER can only view allowed resources', () => {
      expect(can(UserRole.PLAYER, 'dashboard', 'view')).toBe(true);
      expect(can(UserRole.PLAYER, 'roster', 'view')).toBe(true);
      expect(can(UserRole.PLAYER, 'roster', 'create')).toBe(false);
      expect(can(UserRole.PLAYER, 'assets', 'view')).toBe(false);
      expect(can(UserRole.PLAYER, 'cache-store', 'view')).toBe(false);
    });

    test('GUEST has minimal access', () => {
      expect(can(UserRole.GUEST, 'dashboard', 'view')).toBe(true);
      expect(can(UserRole.GUEST, 'roster', 'view')).toBe(true);
      expect(can(UserRole.GUEST, 'matches', 'view')).toBe(true);
      expect(can(UserRole.GUEST, 'analytics', 'view')).toBe(false);
      expect(can(UserRole.GUEST, 'training', 'view')).toBe(false);
      expect(can(UserRole.GUEST, 'assets', 'view')).toBe(false);
    });

    test('returns false for unknown role', () => {
      expect(can('INVALID' as UserRole, 'dashboard', 'view')).toBe(false);
    });
  });

  describe('hasPermissions()', () => {
    test('returns correct role flags', () => {
      expect(hasPermissions(UserRole.SUPER_ADMIN)).toEqual({
        isAdmin: true,
        isPlayer: false,
        isCoach: false,
        isGuest: false,
      });
      expect(hasPermissions(UserRole.PLAYER)).toEqual({
        isAdmin: false,
        isPlayer: true,
        isCoach: false,
        isGuest: false,
      });
    });
  });

  describe('defineAbility()', () => {
    test('can() checks a single permission string', () => {
      const admin = defineAbility(UserRole.SUPER_ADMIN);
      expect(admin.can('roster:create')).toBe(true);
      expect(admin.can('cache-store:view')).toBe(true);

      const guest = defineAbility(UserRole.GUEST);
      expect(guest.can('analytics:view')).toBe(false);
      expect(guest.can('dashboard:view')).toBe(true);
    });

    test('canAll() requires every permission', () => {
      const coach = defineAbility(UserRole.COACH);
      expect(coach.canAll(['training:view', 'training:create'])).toBe(true);
      expect(coach.canAll(['training:view', 'training:delete'])).toBe(false);
    });

    test('canAny() requires at least one permission', () => {
      const player = defineAbility(UserRole.PLAYER);
      expect(player.canAny(['roster:create', 'roster:view'])).toBe(true);
      expect(player.canAny(['roster:create', 'roster:delete'])).toBe(false);
    });

    test('canViewField() delegates to field config', () => {
      expect(defineAbility(UserRole.COACH).canViewField('sensitive')).toBe(
        true,
      );
      expect(defineAbility(UserRole.PLAYER).canViewField('sensitive')).toBe(
        false,
      );
    });
  });
});
