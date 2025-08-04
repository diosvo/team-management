import { ColorPalette } from '@chakra-ui/react';

import { AssetCategory, AssetCondition, UserRole, UserState } from './enum';

/**
 * @description Returns a color from the provided colorMap based on the given value.
 */
function getColor<T>(
  value: Nullable<T>,
  colorMap: Record<string, ColorPalette>
): ColorPalette {
  if (value === null) return 'gray';
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
    [AssetCategory.TRANING]: 'blue',
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
