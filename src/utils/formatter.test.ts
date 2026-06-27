import { format } from 'date-fns';

import { DEFAULT_DAY_FORMAT, LOCALE_DATE_FORMAT } from './constant';
import {
  formatDate,
  formatDatetime,
  formatDay,
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
