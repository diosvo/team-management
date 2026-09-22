import { ALL } from './constants';
import {
  AssetCondition,
  AttendanceStatus,
  LeagueStatus,
  MatchStatus,
  SessionStatus,
  UserState,
} from './enum';

import { colorRank, deriveDateStatus, getColor, lazy } from './helper';

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

describe('lazy', () => {
  test('does not call the getter until the value is accessed', () => {
    const getter = vi.fn(() => 'computed');
    const holder = lazy(getter);

    expect(getter).not.toHaveBeenCalled();
    expect(holder.value).toBe('computed');
    expect(getter).toHaveBeenCalledTimes(1);
  });

  test('caches the result so the getter runs only once', () => {
    const getter = vi.fn(() => ({ id: 1 }));
    const holder = lazy(getter);

    const first = holder.value;
    const second = holder.value;
    const third = holder.value;

    expect(getter).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  test('keeps separate caches per instance', () => {
    let count = 0;
    const getter = vi.fn(() => ++count);

    expect(lazy(getter).value).toBe(1);
    expect(lazy(getter).value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);
  });

  test.each([
    { description: 'null', expected: null },
    { description: 'undefined', expected: undefined },
    { description: 'false', expected: false },
    { description: 'zero', expected: 0 },
  ])('caches $description without recomputing', ({ expected }) => {
    const getter = vi.fn(() => expected);
    const holder = lazy(getter);

    expect(holder.value).toBe(expected);
    expect(holder.value).toBe(expected);
    expect(getter).toHaveBeenCalledTimes(1);
  });

  test('propagates a throwing getter and retries on the next access', () => {
    const getter = vi.fn(() => {
      throw new Error('boom');
    });
    const holder = lazy(getter);

    expect(() => holder.value).toThrow('boom');
    expect(() => holder.value).toThrow('boom');
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
