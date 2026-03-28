import { renderHook } from '@testing-library/react';
import { Mock } from 'vitest';

import authClient from '@/lib/auth-client';
import { UserRole } from '@/utils/enum';

import usePermissions from './use-permissions';

vi.mock('@/lib/auth-client', () => ({
  default: {
    useSession: vi.fn(),
  },
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns default permissions during initial mount', () => {
    (authClient.useSession as Mock).mockReturnValue({
      data: null,
      isPending: false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBeFalsy();
    expect(result.current.isPlayer).toBeFalsy();
    expect(result.current.isCoach).toBeFalsy();
    expect(result.current.isGuest).toBeFalsy();
    expect(result.current.can('dashboard', 'view')).toBeFalsy();
    expect(result.current.canAll(['dashboard:view'])).toBeFalsy();
    expect(result.current.canAny(['dashboard:view'])).toBeFalsy();
    expect(result.current.canViewField('sensitive')).toBeFalsy();
  });

  test('returns false for all permissions when user has no role', () => {
    (authClient.useSession as Mock).mockReturnValue({
      data: {
        session: {},
        user: {},
      },
      isPending: false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBeFalsy();
    expect(result.current.isPlayer).toBeFalsy();
    expect(result.current.isCoach).toBeFalsy();
    expect(result.current.isGuest).toBeFalsy();
  });

  const cases = [
    {
      role: UserRole.SUPER_ADMIN,
      isAdmin: true,
      isPlayer: false,
      isCoach: false,
      isGuest: false,
    },
    {
      role: UserRole.PLAYER,
      isAdmin: false,
      isPlayer: true,
      isCoach: false,
      isGuest: false,
    },
    {
      role: UserRole.COACH,
      isAdmin: false,
      isPlayer: false,
      isCoach: true,
      isGuest: false,
    },
    {
      role: UserRole.GUEST,
      isAdmin: false,
      isPlayer: false,
      isCoach: false,
      isGuest: true,
    },
    {
      role: 'unknown',
      isAdmin: false,
      isPlayer: false,
      isCoach: false,
      isGuest: false,
    },
  ];

  test.each(cases)(
    'returns correct permissions for $role role',
    ({ role, isAdmin, isPlayer, isCoach, isGuest }) => {
      (authClient.useSession as Mock).mockReturnValue({
        data: {
          session: {},
          user: {
            role,
          },
        },
        isPending: false,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(isAdmin);
      expect(result.current.isPlayer).toBe(isPlayer);
      expect(result.current.isCoach).toBe(isCoach);
      expect(result.current.isGuest).toBe(isGuest);
    },
  );

  describe('can()', () => {
    test('SUPER_ADMIN can create roster', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.SUPER_ADMIN } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('roster', 'create')).toBeTruthy();
    });

    test('GUEST cannot view analytics', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.GUEST } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('analytics', 'view')).toBeFalsy();
    });

    test('PLAYER cannot create roster', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.PLAYER } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.can('roster', 'create')).toBeFalsy();
    });
  });

  describe('canViewField()', () => {
    test('SUPER_ADMIN can view sensitive fields', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.SUPER_ADMIN } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canViewField('sensitive')).toBeTruthy();
    });

    test('GUEST cannot view sensitive fields', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.GUEST } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canViewField('sensitive')).toBeFalsy();
    });
  });

  describe('canAll()', () => {
    test('COACH has all training view+create permissions', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.COACH } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(
        result.current.canAll(['training:view', 'training:create']),
      ).toBeTruthy();
    });

    test('COACH lacks training delete so canAll fails', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.COACH } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(
        result.current.canAll(['training:view', 'training:delete']),
      ).toBeFalsy();
    });
  });

  describe('canAny()', () => {
    test('PLAYER can view but not create roster', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.PLAYER } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(
        result.current.canAny(['roster:view', 'roster:create']),
      ).toBeTruthy();
    });

    test('GUEST has no analytics permissions', () => {
      (authClient.useSession as Mock).mockReturnValue({
        data: { session: {}, user: { role: UserRole.GUEST } },
        isPending: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(
        result.current.canAny(['analytics:view', 'analytics:create']),
      ).toBeFalsy();
    });
  });
});
