import { ALL } from './constant';
import {
  AssetCategory,
  AssetCondition,
  AttendanceStatus,
  LeagueStatus,
  MatchStatus,
  UserRole,
  UserState,
} from './enum';

import {
  colorAttendanceStatus,
  colorCategory,
  colorCondition,
  colorLeagueStatus,
  colorMatchResult,
  colorRole,
  colorState,
  hasPermissions,
} from './helper';

function invalidColor(key: string) {
  return [
    { [key]: null, expected: 'gray' },
    { [key]: undefined, expected: 'gray' },
    { [key]: 'other', expected: undefined },
  ];
}

describe('colorRole', () => {
  const cases = [
    { role: UserRole.SUPER_ADMIN, expected: 'orange' },
    { role: UserRole.COACH, expected: 'purple' },
    { role: UserRole.PLAYER, expected: 'blue' },
    { role: ALL.value, expected: 'blue' },
    ...invalidColor('role'),
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
    ...invalidColor('state'),
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
    ...invalidColor('condition'),
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
    ...invalidColor('category'),
  ];

  test.each(cases)(
    'returns $expected for $category',
    ({ category, expected }) => {
      expect(colorCategory(category as string)).toBe(expected);
    },
  );
});

describe('colorLeagueStatus', () => {
  const cases = [
    { status: LeagueStatus.UPCOMING, expected: 'yellow' },
    { status: LeagueStatus.ONGOING, expected: 'green' },
    { status: LeagueStatus.ENDED, expected: 'red' },
    ...invalidColor('status'),
  ];

  test.each(cases)('returns $expected for $status', ({ status, expected }) => {
    expect(colorLeagueStatus(status as string)).toBe(expected);
  });
});

describe('colorMatchResult', () => {
  const cases = [
    { status: MatchStatus.WIN, expected: 'green' },
    { status: MatchStatus.LOSS, expected: 'red' },
    { status: MatchStatus.DRAW, expected: 'gray' },
    ...invalidColor('status'),
  ];

  test.each(cases)('returns $expected for $status', ({ status, expected }) => {
    expect(colorMatchResult(status as string)).toBe(expected);
  });
});

describe('colorAttendanceStatus', () => {
  const cases = [
    { status: AttendanceStatus.ON_TIME, expected: 'green' },
    { status: AttendanceStatus.ABSENT, expected: 'red' },
    { status: AttendanceStatus.LATE, expected: 'orange' },
    ...invalidColor('status'),
  ];

  test.each(cases)('returns $expected for $status', ({ status, expected }) => {
    expect(colorAttendanceStatus(status as string)).toBe(expected);
  });
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
