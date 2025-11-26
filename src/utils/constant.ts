import {
  AssetCategory,
  AssetCondition,
  CoachPosition,
  GameType,
  PlayerPosition,
  TestTypeUnit,
  UserRole,
  UserState,
} from './enum';
import { Option, Selection } from './type';

export const ESTABLISHED_DATE = '2024-02-20';
export const DEFAULT_DOB = '2000-01-01';

export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const LOCALE_DATE_FORMAT = 'dd/MM/yyyy';
export const LOCALE_DATETIME_FORMAT = LOCALE_DATE_FORMAT + ' HH:mm:ss';

export const COOKIE = {
  prefix: 'sgr',
  expires: 60 * 60, // 1 hour in seconds
  maxAge: 10 * 60, // 10 minutes in seconds
};

export const ALL: Option<string> = {
  label: 'All',
  value: 'all',
};

export const SELECTABLE_USER_ROLES = [
  UserRole.COACH,
  UserRole.GUEST,
  UserRole.PLAYER,
];
export const UserRoleSelection: Selection<string> = [
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
export const UserStateSelection: Selection<string> = [
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
  AssetCategory.TRAINING,
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
    value: AssetCategory.TRAINING,
    description: 'Cones, Hurdles, Jump ropes, etc',
  },
  {
    label: 'Others',
    value: AssetCategory.OTHERS,
    description: 'Uniforms, Jerseys, etc',
  },
];
export const AssetCategoryValues = [ALL.value, ...SELECTABLE_ASSET_CATEGORIES];

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
export const AssetConditionValues = [ALL.value, ...SELECTABLE_ASSET_CONDITIONS];

export const GameTypeSelection: Record<GameType, Option<string>> = {
  [GameType['3x3']]: { label: GameType['3x3'], value: GameType['3x3'], max: 5 },
  [GameType['5x5']]: {
    label: GameType['5x5'],
    value: GameType['5x5'],
    max: 15,
  },
};

export const SELECTABLE_TEST_TYPES = [
  TestTypeUnit.METERS,
  TestTypeUnit.PERCENT,
  TestTypeUnit.POINTS,
  TestTypeUnit.REPS,
  TestTypeUnit.SECONDS,
  TestTypeUnit.TIMES,
] as const;
export const TestTypeUnitSelection: Selection<string> = [
  {
    label: 'Meters',
    value: TestTypeUnit.METERS,
  },
  {
    label: 'Percent',
    value: TestTypeUnit.PERCENT,
  },
  {
    label: 'Points',
    value: TestTypeUnit.POINTS,
  },
  {
    label: 'Reps',
    value: TestTypeUnit.REPS,
  },
  {
    label: 'Seconds',
    value: TestTypeUnit.SECONDS,
  },
  {
    label: 'Times',
    value: TestTypeUnit.TIMES,
  },
];
