import { CoachPosition, PlayerPosition, UserRole, UserState } from '../enum';
import type { Selection } from '../type';

export const SELECTABLE_USER_ROLES = [
  UserRole.COACH,
  UserRole.GUEST,
  UserRole.PLAYER,
];
export const USER_ROLE_SELECTION: Selection<string> = [
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

export const SELECTABLE_USER_STATES = [
  UserState.ACTIVE,
  UserState.INACTIVE,
  UserState.TEMPORARILY_ABSENT,
  UserState.UNKNOWN,
];
export const USER_STATE_SELECTION: Selection<string> = [
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
    description: 'Temporarily Absent',
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
export const COACH_POSITIONS_SELECTION: Selection<string> = [
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
  PlayerPosition.POWER_FORWARD,
  PlayerPosition.CENTER,
  PlayerPosition.UNKNOWN,
] as const;
export const PLAYER_POSITIONS_SELECTION: Selection<string> = [
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
    label: 'PF',
    value: PlayerPosition.POWER_FORWARD,
    description: 'Power Forward',
  },
  {
    label: 'C',
    value: PlayerPosition.CENTER,
    description: 'Center',
  },
  {
    label: 'Unknown',
    value: PlayerPosition.UNKNOWN,
  },
];
