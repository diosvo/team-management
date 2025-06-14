import { addHours } from 'date-fns';

import {
  AssetCategory,
  AssetCondition,
  CoachPosition,
  PlayerPosition,
  UserRole,
  UserState,
} from './enum';
import { Option, Selection } from './type';

export const ESTABLISHED_DATE = '2024-02-20';
export const DEFAULT_DOB = '2000-01-01';

export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const LOCALE_DATE_FORMAT = 'dd/MM/yyyy';
export const LOCALE_DATETIME_FORMAT = LOCALE_DATE_FORMAT + ' HH:mm:ss';

// 1 hour in seconds for cache revalidation
export const CACHE_REVALIDATION_TIME = 3600;

// 1 hour for session expiration
export const EXPIRES_AT = addHours(new Date(), 1);

export const ALL: Option<string> = {
  label: 'All',
  value: 'all',
};

export const SELECTABLE_ROLES = [
  UserRole.COACH,
  UserRole.GUEST,
  UserRole.PLAYER,
] as const;
export const RoleSelection: Selection<string> = [
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
export const StateSelection: Selection<string> = [
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
export const CoachPositionsSelection: Selection<string> = [
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
export const PlayerPositionsSelection: Selection<string> = [
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

export const SELECTABLE_ASSET_CATEGORIES = [
  AssetCategory.EQUIPMENT,
  AssetCategory.TRANING,
  AssetCategory.OTHERS,
] as const;
export const AssetCategorySelection: Selection<string> = [
  {
    label: 'Equipment',
    value: AssetCategory.EQUIPMENT,
    description: 'Balls, Backboards, etc',
  },
  {
    label: 'Training',
    value: AssetCategory.TRANING,
    description: 'Cones, Hurdles, Jump ropes, etc',
  },
  {
    label: 'Others',
    value: AssetCategory.OTHERS,
    description: 'Uniforms, Jerseys, etc',
  },
];

export const SELECTABLE_ASSET_CONDITIONS = [
  AssetCondition.POOR,
  AssetCondition.FAIR,
  AssetCondition.GOOD,
] as const;
export const AssetConditionSelection: Selection<string> = [
  {
    label: 'Poor',
    value: AssetCondition.POOR,
    description: 'Broken, Damaged',
  },
  {
    label: 'Fair',
    value: AssetCondition.FAIR,
    description: 'Usable, Slightly Worn',
  },
  {
    label: 'Good',
    value: AssetCondition.GOOD,
    description: 'New, Excellent Condition',
  },
];
