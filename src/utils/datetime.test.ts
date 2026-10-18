import { DEFAULT_TIME_FORMAT } from './constants/app';
import { Interval } from './enum';
import {
  formatCalendarDay,
  formatDate,
  formatDateRange,
  formatDatetime,
  formatDay,
  formatTime,
  formatDayHint,
  getDayPresets,
  getPeriodPresets,
  intervalRange,
  isWithinBounds,
  describeRange,
  parseLocaleDate,
  thisDay,
  thisMonth,
  thisWeek,
  thisYear,
  toIsoDay,
  toLocalDate,
} from './datetime';

// Local-time strings: a bare `yyyy-MM-dd` parses as UTC midnight and would
// slip a day west of GMT.
const DATETIME = new Date('1999-12-12T14:30:00');

describe('formatting', () => {
  test.each([formatDay, formatDate, formatTime, formatDatetime])(
    '%o returns "-" for a missing value',
    (fn) => {
      expect(fn(null)).toBe('-');
      expect(fn(undefined)).toBe('-');
      expect(fn('')).toBe('-');
    },
  );

  test('formatDay names the weekday', () => {
    expect(formatDay(DATETIME)).toBe('Sunday');
    expect(formatDay(DATETIME, 'd MMM')).toBe('12 Dec');
  });

  test('formatDate uses the locale day-first format', () => {
    expect(formatDate(DATETIME)).toBe('12/12/1999');
    expect(formatDate('1999-12-12T00:00:00')).toBe('12/12/1999');
  });

  test('formatTime defaults to 24h and forwards a custom format', () => {
    expect(formatTime(DATETIME)).toBe('14:30:00');
    expect(formatTime(DATETIME, DEFAULT_TIME_FORMAT)).toBe('2:30 PM');
  });

  test('formatDatetime joins date and time', () => {
    expect(formatDatetime(DATETIME)).toBe('12/12/1999 14:30:00');
  });

  test('formatDateRange joins both ends with a dash', () => {
    expect(formatDateRange({ from: '2026-01-01', to: '2026-12-31' })).toBe(
      '01/01/2026 - 31/12/2026',
    );
  });

  test('toIsoDay emits the wire format', () => {
    expect(toIsoDay(DATETIME)).toBe('1999-12-12');
  });

  test('parseLocaleDate inverts formatDate and rejects partial input', () => {
    expect(parseLocaleDate('12/12/1999')).toEqual(
      new Date('1999-12-12T00:00:00'),
    );
    expect(parseLocaleDate('12/12/')).toBeUndefined();
    expect(parseLocaleDate('1999-12-12')).toBeUndefined();
  });
});

describe('calendar days', () => {
  const DAY = { year: 2026, month: 8, day: 1 };

  test('toLocalDate builds a local midnight, not a UTC one', () => {
    expect(toLocalDate(DAY)).toEqual(new Date(2026, 7, 1));
  });

  test('formatCalendarDay shows the locale date', () => {
    expect(formatCalendarDay(DAY)).toBe('01/08/2026');
  });

  test('formatDayHint shows the compact day', () => {
    expect(formatDayHint('2026-08-01')).toBe('1 Aug');
  });
});

describe('windows', () => {
  // A Tuesday, mid-month and mid-year, so no two boundaries can coincide.
  const TODAY = new Date('2026-02-17T12:00:00');

  test('thisWeek spans Monday to Sunday', () => {
    expect(thisWeek(TODAY)).toEqual({ from: '2026-02-16', to: '2026-02-22' });
  });

  test('thisMonth spans the calendar month', () => {
    expect(thisMonth(TODAY)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  test('thisYear spans the calendar year', () => {
    expect(thisYear(TODAY)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});

describe('presets', () => {
  // A Sunday, so the Monday-based week starts six days earlier.
  const TODAY = new Date('2026-08-30T12:00:00');

  const byLabel = (presets: ReturnType<typeof getDayPresets>) =>
    Object.fromEntries(
      presets.map(({ label, range }) => [label, `${range.from}..${range.to}`]),
    );

  test('day presets are one-day windows around today', () => {
    expect(byLabel(getDayPresets(TODAY))).toEqual({
      Today: '2026-08-30..2026-08-30',
      Yesterday: '2026-08-29..2026-08-29',
      Tomorrow: '2026-08-31..2026-08-31',
    });
  });

  test('period presets run a current period to its end, not to today', () => {
    // The whole point of not using the picker's built-in presets: matches and
    // sessions already scheduled later this period must stay in range.
    expect(byLabel(getPeriodPresets(TODAY))).toEqual({
      'This week': '2026-08-24..2026-08-30',
      'Last week': '2026-08-17..2026-08-23',
      'This month': '2026-08-01..2026-08-31',
      'Last month': '2026-07-01..2026-07-31',
      'This year': '2026-01-01..2026-12-31',
      'Last year': '2025-01-01..2025-12-31',
    });
  });

  test('isWithinBounds keeps only windows wholly inside the bounds', () => {
    const july = { from: '2026-07-01', to: '2026-07-31' };

    expect(isWithinBounds(july, {})).toBe(true);
    expect(isWithinBounds(july, { min: '2026-07-01', max: '2026-07-31' })).toBe(
      true,
    );
    // Partial overlap would be clamped by the machine, so it is out.
    expect(isWithinBounds(july, { max: '2026-07-15' })).toBe(false);
    expect(isWithinBounds(july, { min: '2026-07-15' })).toBe(false);
  });

  test('intervalRange rejects an unknown interval', () => {
    expect(() => intervalRange('next_month' as Interval, TODAY)).toThrow(
      'Invalid report interval: next_month',
    );
  });

  test('intervalRange resolves a report interval against today', () => {
    expect(intervalRange(Interval.THIS_MONTH, TODAY)).toEqual(thisMonth(TODAY));
    expect(intervalRange(Interval.LAST_MONTH, TODAY)).toEqual({
      from: '2026-07-01',
      to: '2026-07-31',
    });
    expect(intervalRange(Interval.THIS_YEAR, TODAY)).toEqual(thisYear(TODAY));
    expect(intervalRange(Interval.LAST_YEAR, TODAY)).toEqual({
      from: '2025-01-01',
      to: '2025-12-31',
    });
  });

  test('describeRange names a preset window', () => {
    expect(describeRange(thisDay(TODAY), 'single', TODAY)).toBe('Today');
    expect(
      describeRange({ from: '2026-07-01', to: '2026-07-31' }, 'range', TODAY),
    ).toBe('Last month');
  });

  test('describeRange falls back to the date(s) of a hand-picked window', () => {
    expect(
      describeRange({ from: '2026-02-01', to: '2026-02-01' }, 'single', TODAY),
    ).toBe('01/02/2026');
    expect(
      describeRange({ from: '2026-02-01', to: '2026-02-14' }, 'range', TODAY),
    ).toBe('01/02/2026 - 14/02/2026');
  });

  test('describeRange does not mistake a one-day range for a day preset', () => {
    expect(describeRange(thisDay(TODAY), 'range', TODAY)).toBe(
      '30/08/2026 - 30/08/2026',
    );
  });
});
