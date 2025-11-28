import { ColorPalette } from '@chakra-ui/react';

import { ALL } from './constant';
import {
  AssetCategory,
  AssetCondition,
  LeagueStatus,
  MatchStatus,
  UserRole,
  UserState,
} from './enum';

/**
 * @description Returns a color from the provided colorMap based on the given value.
 */
function getColor<T>(
  value: Nullable<T>,
  colorMap: Record<string, ColorPalette>,
): ColorPalette {
  if (value === ALL.value) return 'blue';
  if (value == null) return 'gray';
  return colorMap[value];
}

export function colorRole(role: string): ColorPalette {
  return getColor(role, {
    [UserRole.SUPER_ADMIN]: 'orange',
    [UserRole.COACH]: 'purple',
    [UserRole.PLAYER]: 'blue',
  });
}

export function colorState(state: string): ColorPalette {
  return getColor(state, {
    [UserState.ACTIVE]: 'green',
    [UserState.TEMPORARILY_ABSENT]: 'orange',
    [UserState.INACTIVE]: 'red',
    [UserState.UNKNOWN]: 'gray',
  });
}

export function colorCondition(condition: string): ColorPalette {
  return getColor(condition, {
    [AssetCondition.GOOD]: 'green',
    [AssetCondition.FAIR]: 'orange',
    [AssetCondition.POOR]: 'red',
  });
}

export function colorCategory(category: string): ColorPalette {
  return getColor(category, {
    [AssetCategory.EQUIPMENT]: 'purple',
    [AssetCategory.TRAINING]: 'blue',
  });
}

export function colorLeagueStatus(status: string) {
  return getColor(status, {
    [LeagueStatus.UPCOMING]: 'yellow',
    [LeagueStatus.ONGOING]: 'green',
    [LeagueStatus.ENDED]: 'red',
  });
}

export function colorMacthResult(status: string) {
  return getColor(status, {
    [MatchStatus.WIN]: 'green',
    [MatchStatus.LOSS]: 'red',
    [MatchStatus.DRAW]: 'gray',
  });
}

export function hasPermissions(role: UserRole) {
  return {
    isAdmin: role === UserRole.SUPER_ADMIN,
    isPlayer: role === UserRole.PLAYER,
    isCoach: role === UserRole.COACH,
    isGuest: role === UserRole.GUEST,
  };
}
