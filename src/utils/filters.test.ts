import { Interval } from './enum';

import { countActiveFilters, paginateData } from './filters';

/* ================== Utility Functions ================== */

describe('paginateData', () => {
  const mockData = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

  test('returns first page with default page size', () => {
    const result = paginateData(mockData, 1);

    expect(result).toEqual([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
      { id: 4, name: 'Item 4' },
      { id: 5, name: 'Item 5' },
    ]);
  });

  test('returns second page with default page size', () => {
    const result = paginateData(mockData, 2);

    expect(result).toEqual([
      { id: 6, name: 'Item 6' },
      { id: 7, name: 'Item 7' },
      { id: 8, name: 'Item 8' },
    ]);
  });

  test('returns first page with custom page size', () => {
    const result = paginateData(mockData, 1, 3);

    expect(result).toEqual([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ]);
  });

  test('returns empty array for page beyond data length', () => {
    const result = paginateData(mockData, 10);

    expect(result).toEqual([]);
  });

  test('returns partial page when data length is not divisible by page size', () => {
    const result = paginateData(mockData, 2, 5);

    expect(result).toEqual([
      { id: 6, name: 'Item 6' },
      { id: 7, name: 'Item 7' },
      { id: 8, name: 'Item 8' },
    ]);
  });

  test('handles empty data array', () => {
    const result = paginateData([], 1);

    expect(result).toEqual([]);
  });

  test('handles page size larger than data length', () => {
    const result = paginateData(mockData, 1, 20);

    expect(result).toEqual(mockData);
  });

  test('handles page size of 1', () => {
    const result = paginateData(mockData, 3, 1);

    expect(result).toEqual([{ id: 3, name: 'Item 3' }]);
  });
});

describe('countActiveFilters', () => {
  test('ignores page and q', () => {
    expect(
      countActiveFilters(
        { page: 5, q: 'finals', status: [] },
        { page: 1, q: '', status: [] },
      ),
    ).toBe(0);
  });

  test('counts scalar and array filters that differ from defaults', () => {
    expect(
      countActiveFilters(
        { interval: Interval.LAST_YEAR, status: ['a'] },
        { interval: Interval.THIS_YEAR, status: [] },
      ),
    ).toBe(2);
  });

  test('treats arrays as equal regardless of order', () => {
    expect(
      countActiveFilters({ status: ['b', 'a'] }, { status: ['a', 'b'] }),
    ).toBe(0);
  });

  test('counts arrays of differing length or members', () => {
    expect(countActiveFilters({ status: ['a'] }, { status: ['a', 'b'] })).toBe(
      1,
    );
    expect(countActiveFilters({ status: ['c'] }, { status: ['a'] })).toBe(1);
  });
});
