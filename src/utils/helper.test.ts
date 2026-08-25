import { ALL } from './constants';
import {
  AssetCondition,
  AttendanceStatus,
  LeagueStatus,
  MatchStatus,
  SessionStatus,
  UserState,
} from './enum';

import { colorRank, deriveDateStatus, getColor } from './helper';

describe('getColor', () => {
  const cases = [
    { value: ALL.value, expected: 'blue' },
    { value: null, expected: 'gray' },
    { value: undefined, expected: 'gray' },
    { value: 'unrecognized_value', expected: 'black' },
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

describe('deriveDateStatus', () => {
  const TODAY = new Date('2026-06-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const cases = [
    {
      description: 'start date is still ahead',
      start_date: '2026-07-01',
      end_date: '2026-08-01',
      expected: LeagueStatus.UPCOMING,
    },
    {
      description: 'today sits between the dates',
      start_date: '2026-06-01',
      end_date: '2026-07-01',
      expected: LeagueStatus.ONGOING,
    },
    {
      description: 'end date has passed',
      start_date: '2026-01-01',
      end_date: '2026-05-01',
      expected: LeagueStatus.ENDED,
    },
    {
      description: 'the league starts today',
      start_date: '2026-06-15',
      end_date: '2026-07-01',
      expected: LeagueStatus.ONGOING,
    },
  ];

  test.each(cases)(
    'returns $expected when $description',
    ({ start_date, end_date, expected }) => {
      expect(deriveDateStatus(start_date, end_date)).toBe(expected);
    },
  );
});
