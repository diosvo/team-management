import { ALL } from './constant';
import {
  AssetCondition,
  AttendanceStatus,
  LeagueStatus,
  MatchStatus,
  SessionStatus,
  UserState,
} from './enum';

import { colorRank, getColor } from './helper';

describe('getColor', () => {
  const cases = [
    { value: ALL.value, expected: 'blue' },
    { value: null, expected: 'gray' },
    { value: undefined, expected: 'gray' },
    { value: 'unknown', expected: 'black' },
    // UserState
    { value: UserState.ACTIVE, expected: 'green' },
    { value: UserState.TEMPORARILY_ABSENT, expected: 'orange' },
    { value: UserState.INACTIVE, expected: 'red' },
    { value: UserState.UNKNOWN, expected: 'gray' },
    // AssetCondition
    { value: AssetCondition.GOOD, expected: 'green' },
    { value: AssetCondition.FAIR, expected: 'orange' },
    { value: AssetCondition.POOR, expected: 'red' },
    { value: AssetCondition.OBSOLETE, expected: 'gray' },
    // LeagueStatus
    { value: LeagueStatus.UPCOMING, expected: 'orange' },
    { value: LeagueStatus.ONGOING, expected: 'green' },
    { value: LeagueStatus.ENDED, expected: 'red' },
    // MatchStatus
    { value: MatchStatus.WIN, expected: 'green' },
    { value: MatchStatus.LOSS, expected: 'red' },
    { value: MatchStatus.DRAW, expected: 'gray' },
    // AttendanceStatus
    { value: AttendanceStatus.ON_TIME, expected: 'green' },
    { value: AttendanceStatus.ABSENT, expected: 'red' },
    { value: AttendanceStatus.LATE, expected: 'orange' },
    // SessionStatus
    { value: SessionStatus.SCHEDULED, expected: 'orange' },
    { value: SessionStatus.ACTIVE, expected: 'green' },
    { value: SessionStatus.COMPLETED, expected: 'gray' },
    { value: SessionStatus.CANCELLED, expected: 'red' },
  ];

  test.each(cases)('returns $expected for $value', ({ value, expected }) => {
    expect(getColor(value)).toBe(expected);
  });
});

describe('colorRank', () => {
  const cases = [
    { value: 80, expected: 'green' },
    { value: 50, expected: 'orange' },
    { value: 0, expected: 'red' },
  ];

  test.each(cases)('returns $expected for $value', ({ value, expected }) => {
    expect(colorRank(value as number)).toBe(expected);
  });
});
