import { ALL } from './constant';
import { AssetCategory, AssetCondition, UserRole, UserState } from './enum';

import {
  colorCategory,
  colorCondition,
  colorRole,
  colorState,
  hasPermissions,
} from './helper';

describe('colorRole', () => {
  const cases = [
    { role: UserRole.SUPER_ADMIN, expected: 'orange' },
    { role: UserRole.COACH, expected: 'purple' },
    { role: UserRole.PLAYER, expected: 'blue' },
    { role: ALL.value, expected: 'blue' },
    { role: null, expected: 'gray' },
    { role: undefined, expected: 'gray' },
    { role: 'unknown', expected: undefined },
  ];

  test.each(cases)('returns $expected for $role', ({ role, expected }) => {
    expect(colorRole(role as string)).toBe(expected);
  });
});

describe('colorState', () => {
  const cases = [
    { state: UserState.ACTIVE, expected: 'green' },
    { state: UserState.TEMPORARILY_ABSENT, expected: 'orange' },
    { state: UserState.INACTIVE, expected: 'red' },
    { state: UserState.UNKNOWN, expected: 'gray' },
    { state: ALL.value, expected: 'blue' },
    { state: null, expected: 'gray' },
    { state: undefined, expected: 'gray' },
    { state: 'invalid', expected: undefined },
  ];

  test.each(cases)('returns $expected for $state', ({ state, expected }) => {
    expect(colorState(state as string)).toBe(expected);
  });
});

describe('colorCondition', () => {
  const cases = [
    { condition: AssetCondition.GOOD, expected: 'green' },
    { condition: AssetCondition.FAIR, expected: 'orange' },
    { condition: AssetCondition.POOR, expected: 'red' },
    { condition: ALL.value, expected: 'blue' },
    { condition: null, expected: 'gray' },
    { condition: undefined, expected: 'gray' },
    { condition: 'damaged', expected: undefined },
  ];

  test.each(cases)(
    'returns $expected for $condition',
    ({ condition, expected }) => {
      expect(colorCondition(condition as string)).toBe(expected);
    },
  );
});

describe('colorCategory', () => {
  const cases = [
    { category: AssetCategory.EQUIPMENT, expected: 'purple' },
    { category: AssetCategory.TRAINING, expected: 'blue' },
    { category: ALL.value, expected: 'blue' },
    { category: null, expected: 'gray' },
    { category: undefined, expected: 'gray' },
    { category: 'other', expected: undefined },
  ];

  test.each(cases)(
    'returns $expected for $category',
    ({ category, expected }) => {
      expect(colorCategory(category as string)).toBe(expected);
    },
  );
});

describe('hasPermissions', () => {
  const cases = [
    {
      role: UserRole.SUPER_ADMIN,
      expected: {
        isAdmin: true,
        isPlayer: false,
        isCoach: false,
        isGuest: false,
      },
    },
    {
      role: UserRole.PLAYER,
      expected: {
        isAdmin: false,
        isPlayer: true,
        isCoach: false,
        isGuest: false,
      },
    },
    {
      role: UserRole.COACH,
      expected: {
        isAdmin: false,
        isPlayer: false,
        isCoach: true,
        isGuest: false,
      },
    },
    {
      role: UserRole.GUEST,
      expected: {
        isAdmin: false,
        isPlayer: false,
        isCoach: false,
        isGuest: true,
      },
    },
  ];

  test.each(cases)(
    'returns correct permissions for $role',
    ({ role, expected }) => {
      expect(hasPermissions(role)).toEqual(expected);
    },
  );
});
