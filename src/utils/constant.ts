import { addHours } from 'date-fns';

import { CoachPosition, PlayerPosition, UserRole, UserState } from './enum';
import { createSelectionOptions } from './formatter';

export const ESTABLISHED_DATE = '2024-02-20';
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const LOCALE_DATE_FORMAT = 'dd/MM/yyyy';
export const LOCALE_DATETIME_FORMAT = LOCALE_DATE_FORMAT + ' HH:mm:ss';

// 1 hour
export const EXPIRES_AT = addHours(new Date(), 1);

export const SELECTABLE_ROLES = [
  UserRole.CAPTAIN,
  UserRole.COACH,
  UserRole.GUEST,
  UserRole.PLAYER,
] as const;
export const RolesSelection = createSelectionOptions(SELECTABLE_ROLES);

export const SELECTABLE_STATES = [
  UserState.ACTIVE,
  UserState.INACTIVE,
  UserState.TEMPORARILY_ABSENT,
] as const;
export const StatesSelection = createSelectionOptions(SELECTABLE_STATES);

export const SELECTABLE_COACH_POSITIONS = [
  CoachPosition.HEAD_COACH,
  CoachPosition.ASSISTANT_COACH,
] as const;
export const CoachPositionsSelection = createSelectionOptions(
  SELECTABLE_COACH_POSITIONS
);

export const SELECTABLE_PLAYER_POSITIONS = [
  PlayerPosition.POINT_GUARD,
  PlayerPosition.SHOOTING_GUARD,
  PlayerPosition.SMALL_FORWARD,
  PlayerPosition.CENTER,
  PlayerPosition.FORWARD,
] as const;
export const PlayerPositionsSelection = createSelectionOptions(
  SELECTABLE_PLAYER_POSITIONS
);
