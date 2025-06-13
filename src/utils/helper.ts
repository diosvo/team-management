import { AssetCategory, AssetCondition, UserRole, UserState } from './enum';

/**
 * @description Common function to handle null strategy and color mapping
 */
function getColor<T>(
  value: Nullable<T>,
  colorMap: Record<string, string>
): string {
  if (value === null) return 'gray';
  return colorMap[value as string];
}

export function colorRole(role: Nullable<string>): string {
  return getColor(role, {
    [UserRole.SUPER_ADMIN]: 'orange',
    [UserRole.COACH]: 'purple',
    [UserRole.PLAYER]: 'blue',
  });
}

export function colorState(state: Nullable<string>): string {
  return getColor(state, {
    [UserState.ACTIVE]: 'green',
    [UserState.TEMPORARILY_ABSENT]: 'orange',
    [UserState.INACTIVE]: 'red',
  });
}

export function colorCondition(condition: Nullable<string>): string {
  return getColor(condition, {
    [AssetCondition.GOOD]: 'green',
    [AssetCondition.FAIR]: 'orange',
    [AssetCondition.POOR]: 'red',
  });
}

export function colorCategory(category: Nullable<string>): string {
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
