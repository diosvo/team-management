import { PerformanceBand, ProgressStatus } from './enum';
import {
  average,
  formatChange,
  formatResult,
  goalOutcome,
  isBetter,
  performanceBand,
  progressStatus,
  relativeChange,
  summarize,
  toNumber,
  unitLabel,
} from './progression';

describe('relativeChange', () => {
  test('is positive when a higher-is-better result rises', () => {
    expect(relativeChange(10, 12, true)).toBeCloseTo(0.2);
  });

  test('is positive when a lower-is-better result drops', () => {
    expect(relativeChange(10, 9, false)).toBeCloseTo(0.1);
  });

  test('returns the sign of the difference from a zero baseline', () => {
    expect(relativeChange(0, 5, true)).toBe(1);
    expect(relativeChange(0, 5, false)).toBe(-1);
    expect(relativeChange(0, 0, true)).toBe(0);
  });
});

describe('isBetter', () => {
  test('compares by direction', () => {
    expect(isBetter(5, 3, true)).toBe(true);
    expect(isBetter(5, 3, false)).toBe(false);
    expect(isBetter(3, 5, false)).toBe(true);
  });
});

describe('average', () => {
  test('is null for no values', () => {
    expect(average([])).toBeNull();
  });

  test('averages the values', () => {
    expect(average([1, 2, 3])).toBe(2);
  });
});

describe('progressStatus', () => {
  test.each([
    [[10], true, ProgressStatus.INSUFFICIENT],
    [[10, 12], true, ProgressStatus.IMPROVING],
    [[10, 8], true, ProgressStatus.REGRESSING],
    [[10, 10.1], true, ProgressStatus.STABLE],
    [[10, 10, 10.1], true, ProgressStatus.PLATEAUING],
    [[8, 10, 10.1], true, ProgressStatus.STABLE],
    [[10, 9], false, ProgressStatus.IMPROVING],
  ] as const)('%j (higher=%s) → %s', (results, higher, expected) => {
    expect(progressStatus([...results], higher)).toBe(expected);
  });
});

describe('performanceBand', () => {
  test('is null without a target', () => {
    expect(performanceBand(10, null, true)).toBeNull();
  });

  test.each([
    [12, PerformanceBand.ELITE],
    [10.5, PerformanceBand.ON_TARGET],
    [9.5, PerformanceBand.BELOW_TARGET],
    [5, PerformanceBand.NEEDS_WORK],
  ])('%s against a target of 10 → %s', (value, expected) => {
    expect(performanceBand(value, 10, true)).toBe(expected);
  });
});

describe('summarize', () => {
  const history = [
    { date: '2026-01-01', result: 10 },
    { date: '2026-02-01', result: 14 },
    { date: '2026-03-01', result: 12 },
  ];

  test('summarises a higher-is-better series', () => {
    expect(summarize(history, true, 12)).toEqual({
      baseline: history[0],
      latest: history[2],
      best: history[1],
      count: 3,
      change: 0.2,
      status: ProgressStatus.REGRESSING,
      band: PerformanceBand.ON_TARGET,
    });
  });

  test('picks the lowest result as best when lower is better', () => {
    expect(summarize(history, false, null)).toMatchObject({
      best: history[0],
      band: null,
    });
  });
});

describe('toNumber', () => {
  test('parses decimals and keeps nullish as null', () => {
    expect(toNumber('1.5')).toBe(1.5);
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
  });
});

describe('formatResult', () => {
  test('rounds to two decimals with an optional unit', () => {
    expect(formatResult(12.5, 'seconds')).toBe('12.5 seconds');
    expect(formatResult(1.23456)).toBe('1.23');
    expect(formatResult(3, null)).toBe('3');
  });

  test('renders percent as a symbol', () => {
    expect(formatResult(65, 'percent')).toBe('65%');
  });
});

describe('unitLabel', () => {
  test('maps percent to % and keeps other units', () => {
    expect(unitLabel('percent')).toBe('%');
    expect(unitLabel('reps')).toBe('reps');
  });
});

describe('formatChange', () => {
  test('signs positive changes only', () => {
    expect(formatChange(0.123)).toBe('+12.3%');
    expect(formatChange(-0.05)).toBe('-5.0%');
    expect(formatChange(0)).toBe('0.0%');
  });
});

describe('goalOutcome', () => {
  test('is pending until the next result', () => {
    expect(goalOutcome(40, null, true)).toBe('pending');
    expect(goalOutcome(40, undefined, false)).toBe('pending');
  });

  test('higher is better: met at or above the goal', () => {
    expect(goalOutcome(40, 40, true)).toBe('met');
    expect(goalOutcome(40, 42, true)).toBe('met');
    expect(goalOutcome(40, 38, true)).toBe('missed');
  });

  test('lower is better: met at or below the goal', () => {
    expect(goalOutcome(3.3, 3.2, false)).toBe('met');
    expect(goalOutcome(3.3, 3.5, false)).toBe('missed');
  });
});
