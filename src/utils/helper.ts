import { UserRole, UserState } from './enum';

export function colorState(state: string): string {
  return state === UserState.ACTIVE
    ? 'green'
    : state === UserState.TEMPORARILY_ABSENT
    ? 'orange'
    : state === UserState.INACTIVE
    ? 'red'
    : 'gray';
}

export function hasPermissions(role: UserRole) {
  return {
    isAdmin: role === UserRole.SUPER_ADMIN,
    isPlayer: role === UserRole.PLAYER,
    isCoach: role === UserRole.COACH,
    isGuest: role === UserRole.GUEST,
  };
}
