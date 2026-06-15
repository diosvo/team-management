import { ColorPalette } from '@chakra-ui/react';

import { ALL } from './constant';
import {
  AssetCategory,
  AssetCondition,
  AttendanceStatus,
  LeagueStatus,
  MatchStatus,
  SessionStatus,
  UserRole,
  UserState,
} from './enum';

const COLOR_MAP: Partial<Record<ColorPalette, string[]>> = {
  blue: [UserRole.PLAYER],
  gray: [
    UserState.UNKNOWN,
    AssetCondition.OBSOLETE,
    AssetCategory.OTHERS,
    MatchStatus.DRAW,
    SessionStatus.COMPLETED,
  ],
  green: [
    UserState.ACTIVE,
    AssetCondition.GOOD,
    AssetCategory.EQUIPMENT,
    LeagueStatus.ONGOING,
    MatchStatus.WIN,
    AttendanceStatus.ON_TIME,
    SessionStatus.ACTIVE,
  ],
  orange: [
    UserRole.SUPER_ADMIN,
    UserState.TEMPORARILY_ABSENT,
    AssetCondition.FAIR,
    AssetCategory.TRAINING,
    LeagueStatus.UPCOMING,
    AttendanceStatus.LATE,
  ],
  purple: [UserRole.COACH],
  red: [
    UserState.INACTIVE,
    AssetCondition.POOR,
    LeagueStatus.ENDED,
    MatchStatus.LOSS,
    AttendanceStatus.ABSENT,
    SessionStatus.CANCELLED,
  ],
  yellow: [SessionStatus.SCHEDULED],
};

const COLOR_LOOKUP = new Map<string, ColorPalette>(
  Object.entries(COLOR_MAP).flatMap(([color, values]) =>
    values!.map((value) => [value, color as ColorPalette]),
  ),
);

export function getColor(value: Nullable<string>): ColorPalette {
  if (value === ALL.value) return 'blue';
  if (value == null) return 'gray';
  return COLOR_LOOKUP.get(value) ?? 'gray';
}

export function colorPlayerRank(rate: number): ColorPalette {
  if (rate >= 80) return 'green';
  if (rate >= 50) return 'orange';
  return 'red';
}
