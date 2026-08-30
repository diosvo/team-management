import { formatValueUnit } from './formatter';

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
