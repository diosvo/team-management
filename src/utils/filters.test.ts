import { Interval } from './enum';

import { buildPredicate, countActiveFilters, paginateData } from './filters';

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

describe('buildPredicate', () => {
  type Row = {
    name: string;
    email: string;
    state: string;
    role: string;
    nested?: { city: string };
  };

  const rows: Array<Row> = [
    { name: 'Alice', email: 'alice@x.io', state: 'active', role: 'admin' },
    { name: 'Bob', email: 'bob@y.io', state: 'inactive', role: 'guest' },
    {
      name: 'Carol',
      email: 'carol@x.io',
      state: 'active',
      role: 'guest',
      nested: { city: 'Hanoi' },
    },
  ];

  test('matches everything when config is empty', () => {
    expect(rows.filter(buildPredicate<Row>({}))).toEqual(rows);
  });

  test('searches across fields (case-insensitive, OR)', () => {
    const result = rows.filter(
      buildPredicate<Row>({ search: { query: 'ALICE', fields: ['name', 'email'] } }),
    );
    expect(result.map((r) => r.name)).toEqual(['Alice']);
  });

  test('ignores blank/whitespace query', () => {
    expect(
      rows.filter(buildPredicate<Row>({ search: { query: '   ', fields: ['name'] } })),
    ).toEqual(rows);
  });

  test('supports accessor fields for nested values', () => {
    const result = rows.filter(
      buildPredicate<Row>({
        search: { query: 'hanoi', fields: [(r) => r.nested?.city] },
      }),
    );
    expect(result.map((r) => r.name)).toEqual(['Carol']);
  });

  test('match keys map to item properties and AND together', () => {
    const result = rows.filter(
      buildPredicate<Row>({ match: { state: ['active'], role: ['guest'] } }),
    );
    expect(result.map((r) => r.name)).toEqual(['Carol']);
  });

  test('empty selection is ignored', () => {
    const result = rows.filter(
      buildPredicate<Row>({ match: { state: [], role: ['admin'] } }),
    );
    expect(result.map((r) => r.name)).toEqual(['Alice']);
  });

  test('combines search and match', () => {
    const result = rows.filter(
      buildPredicate<Row>({
        search: { query: 'x.io', fields: ['email'] },
        match: { state: ['active'] },
      }),
    );
    expect(result.map((r) => r.name)).toEqual(['Alice', 'Carol']);
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
