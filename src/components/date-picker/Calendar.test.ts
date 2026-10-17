import { isSameSelection, parseIsoDay, toSelection } from './Calendar';

describe('Calendar helpers', () => {
  test('parseIsoDay reads an ISO day and rejects empty or malformed input', () => {
    expect(parseIsoDay('2026-02-14')?.toString()).toBe('2026-02-14');
    expect(parseIsoDay('')).toBeUndefined();
    expect(parseIsoDay(undefined)).toBeUndefined();
    expect(parseIsoDay('14/02/2026')).toBeUndefined();
  });

  test('toSelection keeps both ends for a range and one day for single', () => {
    const range = { from: '2026-02-01', to: '2026-02-28' };

    expect(toSelection(range, 'range').map(String)).toEqual([
      '2026-02-01',
      '2026-02-28',
    ]);
    expect(toSelection(range, 'single').map(String)).toEqual(['2026-02-01']);
  });

  test('toSelection drops a window with a malformed end', () => {
    expect(toSelection({ from: '2026-02-01', to: 'nope' }, 'range')).toEqual(
      [],
    );
  });

  test('isSameSelection compares day by day', () => {
    const a = toSelection({ from: '2026-02-01', to: '2026-02-28' }, 'range');
    const b = toSelection({ from: '2026-02-01', to: '2026-02-27' }, 'range');

    expect(isSameSelection(a, a)).toBe(true);
    expect(isSameSelection(a, b)).toBe(false);
    expect(isSameSelection(a, a.slice(0, 1))).toBe(false);
  });
});
