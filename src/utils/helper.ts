import { ColorPalette } from '@chakra-ui/react';

import { ALL } from './constant';
import {
  AssetCategory,
  AssetCondition,
  AttendanceStatus,
  EmailStatus,
  LeagueStatus,
  MatchStatus,
  SessionStatus,
  UserRole,
  UserState,
} from './enum';

const COLOR_MAP: Partial<Record<ColorPalette, Array<string>>> = {
  blue: [UserRole.PLAYER, EmailStatus.SENT],
  gray: [
    AssetCategory.OTHERS,
    AssetCondition.OBSOLETE,
    EmailStatus.CANCELED,
    EmailStatus.QUEUED,
    EmailStatus.SUPPRESSED,
    MatchStatus.DRAW,
    SessionStatus.COMPLETED,
    UserState.UNKNOWN,
  ],
  green: [
    AssetCategory.EQUIPMENT,
    AssetCondition.GOOD,
    AttendanceStatus.ON_TIME,
    EmailStatus.CLICKED,
    EmailStatus.DELIVERED,
    EmailStatus.OPENED,
    LeagueStatus.ONGOING,
    MatchStatus.WIN,
    SessionStatus.ACTIVE,
    UserState.ACTIVE,
  ],
  orange: [
    AssetCategory.TRAINING,
    AssetCondition.FAIR,
    AttendanceStatus.LATE,
    EmailStatus.DELIVERY_DELAYED,
    EmailStatus.SCHEDULED,
    LeagueStatus.UPCOMING,
    UserRole.SUPER_ADMIN,
    UserState.TEMPORARILY_ABSENT,
    SessionStatus.SCHEDULED,
  ],
  purple: [UserRole.COACH],
  red: [
    AssetCondition.POOR,
    AttendanceStatus.ABSENT,
    EmailStatus.BOUNCED,
    EmailStatus.COMPLAINED,
    EmailStatus.FAILED,
    LeagueStatus.ENDED,
    MatchStatus.LOSS,
    SessionStatus.CANCELLED,
    UserState.INACTIVE,
  ],
};

const COLOR_LOOKUP = new Map<string, ColorPalette>(
  Object.entries(COLOR_MAP).flatMap(([color, values]) =>
    values!.map((value) => [value, color as ColorPalette]),
  ),
);

export function getColor(value: Nullish<string>): ColorPalette {
  if (value === ALL.value) return 'blue';
  if (value == null) return 'gray';
  return COLOR_LOOKUP.get(value) ?? 'black';
}

export function colorRank(rate: number): ColorPalette {
  if (rate >= 80) return 'green';
  if (rate >= 50) return 'orange';
  return 'red';
}
