import { act, renderHook } from '@testing-library/react';

import { useFilteredPagination } from './use-filtered-pagination';

type Item = { id: string; name: string };

const items: Array<Item> = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
  { id: '4', name: 'Dave' },
  { id: '5', name: 'Eve' },
  { id: '6', name: 'Frank' },
];

const matchAll = (_: Item) => true;
const matchNone = (_: Item) => false;
const matchABC = ({ name }: Item) => ['Alice', 'Bob', 'Charlie'].includes(name);

describe('useFilteredPagination', () => {
  const setup = (
    predicate: (item: Item) => boolean = matchAll,
    page: number = 1,
    pageSize?: number,
  ) => {
    return renderHook(() =>
      useFilteredPagination(items, predicate, page, pageSize),
    );
  };

  describe('filtering', () => {
    test('returns all items when predicate matches everything', () => {
      const { result } = setup();

      expect(result.current.totalCount).toBe(6);
    });

    test('returns no items when predicate matches nothing', () => {
      const { result } = setup(matchNone);

      expect(result.current.totalCount).toBe(0);
      expect(result.current.items).toHaveLength(0);
    });

    test('filters items by predicate', () => {
      const { result } = setup(matchABC);

      expect(result.current.totalCount).toBe(3);
      expect(result.current.items.map(({ name }) => name)).toEqual([
        'Alice',
        'Bob',
        'Charlie',
      ]);
    });
  });

  describe('pagination', () => {
    test('returns first page of items using default page size (5)', () => {
      const { result } = setup();

      expect(result.current.currentData).toHaveLength(5);
      expect(result.current.currentData[0].name).toBe('Alice');
    });

    test('returns second page of items', () => {
      const { result } = setup(matchAll, 2);

      expect(result.current.currentData).toHaveLength(1);
      expect(result.current.currentData[0].name).toBe('Frank');
    });

    test('respects custom pageSize', () => {
      const { result } = setup(matchAll, 1, 2);

      expect(result.current.currentData).toHaveLength(2);
      expect(result.current.currentData.map(({ name }) => name)).toEqual([
        'Alice',
        'Bob',
      ]);
    });

    test('currentData reflects filtered + paginated items', () => {
      const { result } = setup(matchABC, 1, 2);

      expect(result.current.totalCount).toBe(3);
      expect(result.current.currentData).toHaveLength(2);
      expect(result.current.currentData.map(({ name }) => name)).toEqual([
        'Alice',
        'Bob',
      ]);
    });
  });

  describe('selection', () => {
    test('initialises with an empty selection', () => {
      const { result } = setup();

      expect(result.current.selection).toEqual([]);
    });

    test('setSelection updates the selection', () => {
      const { result } = setup();

      act(() => result.current.setSelection(['1', '2']));

      expect(result.current.selection).toEqual(['1', '2']);
    });

    test('clears selection when predicate reference changes', () => {
      let predicate = matchAll;
      const { result, rerender } = renderHook(() =>
        useFilteredPagination(items, predicate, 1),
      );

      act(() => result.current.setSelection(['1', '2']));
      expect(result.current.selection).toEqual(['1', '2']);

      predicate = matchABC;
      rerender();

      expect(result.current.selection).toEqual([]);
    });

    test('preserves selection when predicate reference is stable', () => {
      const { result, rerender } = setup();

      act(() => result.current.setSelection(['1']));

      rerender();

      expect(result.current.selection).toEqual(['1']);
    });

    test('preserves selection when only page changes', () => {
      let page = 1;
      const { result, rerender } = renderHook(() =>
        useFilteredPagination(items, matchAll, page),
      );

      act(() => result.current.setSelection(['1']));

      page = 2;
      rerender();

      expect(result.current.selection).toEqual(['1']);
    });
  });
});
