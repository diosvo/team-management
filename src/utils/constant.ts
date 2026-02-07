import {
  AssetCategory,
  AssetCondition,
  AttendanceStatus,
  CoachPosition,
  Interval,
  LeagueStatus,
  PlayerPosition,
  TestTypeUnit,
  UserRole,
  UserState,
} from './enum';
import { Option, Selection } from './type';

export const ESTABLISHED_DATE = '2024-02-20';
export const DEFAULT_DOB = '2000-01-01';
export const CURRENT_DATE = new Date().toISOString().split('T')[0];

export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const LOCALE_DATE_FORMAT = 'dd/MM/yyyy';
export const LOCAL_TIME_FORMAT = 'HH:mm:ss';
export const LOCALE_DATETIME_FORMAT =
  LOCALE_DATE_FORMAT + ' ' + LOCAL_TIME_FORMAT;

export const COOKIE = {
  prefix: 'sgr',
  expires: 60 * 60, // 1 hour in seconds
  maxAge: 10 * 60, // 10 minutes in seconds
};

export const ALL: Option<string> = {
  label: 'All',
  value: 'all',
};

export const MONTHS_SELECTION: Selection<number> = Array.from(
  { length: 12 },
  (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }),
);

export const YEARS_SELECTION: Selection<number> = Array.from(
  {
    length:
      new Date().getFullYear() - new Date(ESTABLISHED_DATE).getFullYear() + 1,
  },
  (_, i) => {
    const year = new Date(ESTABLISHED_DATE).getFullYear() + i;
    return {
      label: year.toString(),
      value: year,
    };
  },
);

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

export const SELECTABLE_ASSET_CATEGORIES = [
  AssetCategory.EQUIPMENT,
  AssetCategory.TRAINING,
  AssetCategory.OTHERS,
] as const;
export const ASSET_CATEGORY_SELECTION: Selection<string> = [
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
export const ASSET_CATEGORY_VALUES = [
  ALL.value,
  ...SELECTABLE_ASSET_CATEGORIES,
];

export const SELECTABLE_ASSET_CONDITIONS = [
  AssetCondition.POOR,
  AssetCondition.FAIR,
  AssetCondition.GOOD,
] as const;
export const ASSET_CONDITION_SELECTION: Selection<string> = [
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
export const ASSET_CONDITION_VALUES = [
  ALL.value,
  ...SELECTABLE_ASSET_CONDITIONS,
];

export const GAME_TYPE_SELECTION: Selection<string> = [
  {
    label: '3x3',
    value: 'false',
  },
  {
    label: '5x5',
    value: 'true',
  },
];

export const INTERVAL_SELECTION: Selection<string> = [
  {
    label: 'This month',
    value: Interval.THIS_MONTH,
  },
  {
    label: 'Last month',
    value: Interval.LAST_MONTH,
  },
  {
    label: 'This year',
    value: Interval.THIS_YEAR,
  },
  {
    label: 'Last year',
    value: Interval.LAST_YEAR,
  },
];
export const INTERVAL_VALUES = INTERVAL_SELECTION.map(({ value }) => value);

export const SELECTABLE_LEAGUE_STATUS = [
  LeagueStatus.UPCOMING,
  LeagueStatus.ONGOING,
  LeagueStatus.ENDED,
] as const;
export const LEAGUE_STATUS_SELECTION: Selection<string> = [
  {
    label: 'Upcoming',
    value: LeagueStatus.UPCOMING,
  },
  {
    label: 'Ongoing',
    value: LeagueStatus.ONGOING,
  },
  {
    label: 'Ended',
    value: LeagueStatus.ENDED,
  },
];
export const LEAGUE_STATUS_VALUES = [ALL.value, ...SELECTABLE_LEAGUE_STATUS];

export const SELECTABLE_ATTENDANCE_STATUS = [
  AttendanceStatus.ON_TIME,
  AttendanceStatus.LATE,
  AttendanceStatus.ABSENT,
] as const;
export const ATTENDANCE_STATUS_SELECTION: Selection<string> = [
  {
    label: 'On Time',
    value: AttendanceStatus.ON_TIME,
  },
  {
    label: 'Late',
    value: AttendanceStatus.LATE,
  },
  {
    label: 'Absent',
    value: AttendanceStatus.ABSENT,
  },
];
export const ATTENDANCE_STATUS_VALUES = [
  ALL.value,
  ...SELECTABLE_ATTENDANCE_STATUS,
];

export const SELECTABLE_TEST_TYPES = [
  TestTypeUnit.METERS,
  TestTypeUnit.PERCENT,
  TestTypeUnit.POINTS,
  TestTypeUnit.REPS,
  TestTypeUnit.SECONDS,
  TestTypeUnit.TIMES,
] as const;
export const TEST_TYPE_UNIT_SELECTION: Selection<string> = [
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
