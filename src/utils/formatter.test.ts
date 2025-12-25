import { format } from 'date-fns';

import { capitalize, formatDate, formatDatetime, mockDelay } from './formatter';

vi.mock('date-fns', () => ({
  format: vi.fn(),
}));

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
    expect(format).toHaveBeenCalledWith(date, expect.any(String));
  });

  test('formats date string correctly', () => {
    const dateString = '1999-12-12';
    vi.mocked(format).mockReturnValue('12/12/1999');

    expect(formatDate(dateString)).toBe('12/12/1999');
    expect(format).toHaveBeenCalledWith(dateString, expect.any(String));
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

describe('capitalize', () => {
  const cases = [
    { input: '', expected: '' },
    { input: 'a', expected: 'A' },
    { input: 'hello', expected: 'Hello' },
    { input: 'HELLO', expected: 'HELLO' },
    { input: 'Hello', expected: 'Hello' },
  ];

  test.each(cases)('capitalizes $input to $expected', ({ input, expected }) => {
    expect(capitalize(input)).toBe(expected);
  });
});

describe('mockDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('resolves after specified milliseconds', async () => {
    const promise = mockDelay(1000);

    vi.advanceTimersByTime(999);
    expect(promise).not.toBe(
      await Promise.race([promise, Promise.resolve('early')]),
    );

    vi.advanceTimersByTime(1);
    await expect(promise).resolves.toBeUndefined();
  });

  test('works with zero delay', async () => {
    const promise = mockDelay(0);
    vi.advanceTimersByTime(0);
    await expect(promise).resolves.toBeUndefined();
  });

  test('works with large delay values', async () => {
    const promise = mockDelay(5000);
    vi.advanceTimersByTime(5000);
    await expect(promise).resolves.toBeUndefined();
  });
});
