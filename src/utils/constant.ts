import { addHours } from 'date-fns';

import { SelectionOption } from '@/components/ui/select';
import { CoachPosition, PlayerPosition, UserRole, UserState } from './enum';

export const ESTABLISHED_DATE = '2024-02-20';
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const LOCALE_DATE_FORMAT = 'dd/MM/yyyy';
export const LOCALE_DATETIME_FORMAT = LOCALE_DATE_FORMAT + ' HH:mm:ss';

// 1 hour
export const EXPIRES_AT = addHours(new Date(), 1);

export const SELECTABLE_ROLES = [
  UserRole.COACH,
  UserRole.GUEST,
  UserRole.PLAYER,
] as const;
export const RolesSelection: Array<SelectionOption<string>> = [
  {
    label: 'Player',
    value: UserRole.PLAYER,
  },
  {
    label: 'Coach',
    value: UserRole.COACH,
  },
  {
    label: 'Guest',
    value: UserRole.GUEST,
  },
];

export const SELECTABLE_STATES = [
  UserState.ACTIVE,
  UserState.INACTIVE,
  UserState.TEMPORARILY_ABSENT,
  UserState.UNKNOWN,
] as const;
export const StatesSelection: Array<SelectionOption<string>> = [
  {
    label: 'Active',
    value: UserState.ACTIVE,
  },
  {
    label: 'Inactive',
    value: UserState.INACTIVE,
  },
  {
    label: 'Absent',
    value: UserState.TEMPORARILY_ABSENT,
    description: 'Temporarily',
  },
  {
    label: 'Unknown',
    value: UserState.UNKNOWN,
  },
];

export const SELECTABLE_COACH_POSITIONS = [
  CoachPosition.HEAD_COACH,
  CoachPosition.ASSISTANT_COACH,
  CoachPosition.UNKNOWN,
] as const;
export const CoachPositionsSelection: Array<SelectionOption<string>> = [
  {
    label: 'Head',
    value: CoachPosition.HEAD_COACH,
    description: 'Head Coach',
  },
  {
    label: 'Assistant',
    value: CoachPosition.ASSISTANT_COACH,
    description: 'Assistant Coach',
  },
  {
    label: 'Unknown',
    value: CoachPosition.UNKNOWN,
  },
];

export const SELECTABLE_PLAYER_POSITIONS = [
  PlayerPosition.POINT_GUARD,
  PlayerPosition.SHOOTING_GUARD,
  PlayerPosition.SMALL_FORWARD,
  PlayerPosition.CENTER,
  PlayerPosition.FORWARD,
  PlayerPosition.UNKNOWN,
] as const;
export const PlayerPositionsSelection: Array<SelectionOption<string>> = [
  {
    label: 'PG',
    value: PlayerPosition.POINT_GUARD,
    description: 'Point Guard',
  },
  {
    label: 'SG',
    value: PlayerPosition.SHOOTING_GUARD,
    description: 'Shooting Guard',
  },
  {
    label: 'SF',
    value: PlayerPosition.SMALL_FORWARD,
    description: 'Small Forward',
  },
  {
    label: 'C',
    value: PlayerPosition.CENTER,
    description: 'Center',
  },
  {
    label: 'F',
    value: PlayerPosition.FORWARD,
    description: 'Forward',
  },
  {
    label: 'Unknown',
    value: PlayerPosition.UNKNOWN,
  },
];
