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
});
