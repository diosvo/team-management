import { UserRole, UserState } from './enum';

export const LOCALE = 'vi-VN';

// 1 hour
export const EXPIRES_AT = new Date(new Date().getTime() + 3600 * 1000);

export const SELECTABLE_ROLES = [
  UserRole.CAPTAIN,
  UserRole.COACH,
  UserRole.GUEST,
  UserRole.PLAYER,
] as const;
export const SELECTABLE_STATES = [
  UserState.ACTIVE,
  UserState.INACTIVE,
  UserState.TEMPORARILY_ABSENT,
  UserState.UNKNOWN,
] as const;
