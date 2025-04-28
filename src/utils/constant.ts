import { addHours } from 'date-fns';

import { UserRole, UserState } from './enum';

export const ESTABLISHED_DATE = '2024-02-20';
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const LOCALE_DATE_FORMAT = 'dd/MM/yyyy';
export const LOCALE_DATETIME_FORMAT = LOCALE_DATE_FORMAT + 'HH:mm:ss';

// 1 hour
export const EXPIRES_AT = addHours(new Date(), 1);

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
