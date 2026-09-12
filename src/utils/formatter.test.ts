import { format } from 'date-fns';

import {
  DEFAULT_DAY_FORMAT,
  DEFAULT_TIME_FORMAT,
  LOCALE_DATE_FORMAT,
  LOCALE_TIME_FORMAT,
} from './constants/app';
import {
  formatDate,
  formatDatetime,
  formatDay,
  formatTime,
  formatValueUnit,
} from './formatter';

vi.mock('date-fns', () => ({
  format: vi.fn(),
  subMonths: vi.fn(),
  subYears: vi.fn(),
  startOfMonth: vi.fn(),
  endOfMonth: vi.fn(),
  startOfYear: vi.fn(),
  endOfYear: vi.fn(),
}));

describe('formatDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns "-" when date is null or undefined', () => {
    expect(formatDay(null)).toBe('-');
    expect(formatDay(undefined)).toBe('-');
  });

  test('formats day correctly', () => {
    const date = new Date('1999-12-12');
    vi.mocked(format).mockReturnValue('Sunday');

    expect(formatDay(date)).toBe('Sunday');
    expect(format).toHaveBeenCalledWith(date, DEFAULT_DAY_FORMAT);
  });
});

describe('formatDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns "-" when date is null or undefined', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
  });

  test('formats date object correctly', () => {
    const date = new Date('1999-12-12');
    vi.mocked(format).mockReturnValue('12/12/1999');

    expect(formatDate(date)).toBe('12/12/1999');
    expect(format).toHaveBeenCalledWith(date, LOCALE_DATE_FORMAT);
  });

  test('formats date string correctly', () => {
    const dateString = '1999-12-12';
    vi.mocked(format).mockReturnValue('12/12/1999');

    expect(formatDate(dateString)).toBe('12/12/1999');
    expect(format).toHaveBeenCalledWith(dateString, LOCALE_DATE_FORMAT);
  });
});

describe('formatTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns "-" when date is null or undefined', () => {
    expect(formatTime(null)).toBe('-');
    expect(formatTime(undefined)).toBe('-');
    expect(format).not.toHaveBeenCalled();
  });

  test('returns "-" for an empty string', () => {
    expect(formatTime('')).toBe('-');
    expect(format).not.toHaveBeenCalled();
  });

  test('formats date object with the default time format', () => {
    const date = new Date('1999-12-12T14:30:00');
    vi.mocked(format).mockReturnValue('14:30:00');

    expect(formatTime(date)).toBe('14:30:00');
    expect(format).toHaveBeenCalledWith(date, LOCALE_TIME_FORMAT);
  });

  test('formats date string with the default time format', () => {
    const dateString = '1999-12-12T14:30:00';
    vi.mocked(format).mockReturnValue('14:30:00');

    expect(formatTime(dateString)).toBe('14:30:00');
    expect(format).toHaveBeenCalledWith(dateString, LOCALE_TIME_FORMAT);
  });

  test('forwards a custom time format to date-fns', () => {
    const date = new Date('1999-12-12T14:30:00');
    vi.mocked(format).mockReturnValue('2:30 PM');

    expect(formatTime(date, DEFAULT_TIME_FORMAT)).toBe('2:30 PM');
    expect(format).toHaveBeenCalledWith(date, DEFAULT_TIME_FORMAT);
  });
});

describe('formatDatetime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns "-" when datetime is null or undefined', () => {
    expect(formatDatetime(null)).toBe('-');
    expect(formatDatetime(undefined)).toBe('-');
  });

  test('formats datetime object correctly', () => {
    const datetime = new Date('1999-12-12T14:30:00');
    vi.mocked(format).mockReturnValue('12/12/1999 02:30 PM');

    expect(formatDatetime(datetime)).toBe('12/12/1999 02:30 PM');
    expect(format).toHaveBeenCalledWith(datetime, expect.any(String));
  });

  test('formats datetime string correctly', () => {
    const datetimeString = '1999-12-12T14:30:00';
    vi.mocked(format).mockReturnValue('12/12/1999 02:30 PM');

    expect(formatDatetime(datetimeString)).toBe('12/12/1999 02:30 PM');
    expect(format).toHaveBeenCalledWith(datetimeString, expect.any(String));
  });
});

describe('formatValueUnit', () => {
  test('returns null when count is 0', () => {
    expect(formatValueUnit(0, 'item')).toBeNull();
  });

  test('returns singular unit when count is 1', () => {
    expect(formatValueUnit(1, 'item')).toBe('item');
  });

  test('returns plural unit when count is greater than 1', () => {
    expect(formatValueUnit(2, 'item')).toBe('items');
    expect(formatValueUnit(10, 'item')).toBe('items');
  });

  test('does not double-pluralize units already ending in "s"', () => {
    expect(formatValueUnit(5, 'pts')).toBe('pts');
    expect(formatValueUnit(1, 'pts')).toBe('pts');
  });

  test('shows symbols and multi-word phrases verbatim (no plural, no hide)', () => {
    expect(formatValueUnit(0, '%')).toBe('%');
    expect(formatValueUnit(50, '%')).toBe('%');
    expect(formatValueUnit(3, 'days remaining')).toBe('days remaining');
  });
});
