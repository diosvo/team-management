import { v4 as uuidV4 } from 'uuid';
import { UserRole } from './enum';

export const UUID = uuidV4();

// 1 hour
export const EXPIRES_AT = new Date(new Date().getTime() + 3600 * 1000);

export const SELECTABLE_ROLES = [
  UserRole.CAPTAIN,
  UserRole.COACH,
  UserRole.GUEST,
  UserRole.PLAYER,
] as const;
