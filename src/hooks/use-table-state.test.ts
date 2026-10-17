import {
  act,
  renderHook as renderHookBase,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { createElement, type PropsWithChildren } from 'react';
import type { Mock } from 'vitest';

import messages from '@/i18n/messages/en';

import { createToasterMock, mockToaster } from '@/test/helpers';

import usePermissions from './use-permissions';
import useTableState, { toggleSelection } from './use-table-state';

vi.mock('./use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

const wrapper = ({ children }: PropsWithChildren) =>
  createElement(NextIntlClientProvider, { locale: 'en', messages, children });

const renderHook = <R>(callback: () => R) =>
  renderHookBase(callback, { wrapper });

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

describe('useTableState', () => {
  beforeEach(() => {
    (usePermissions as Mock).mockReturnValue({ isAdmin: false });
  });

  const setup = (
    predicate: (item: Item) => boolean = matchAll,
    page: number = 1,
    pageSize?: number,
  ) => {
    return renderHook(() => useTableState(items, predicate, page, { pageSize }))
      .result;
  };

  describe('filtering', () => {
    test('returns all items when predicate matches everything', () => {
      const result = setup();

      expect(result.current.totalCount).toBe(6);
    });

    test('returns no items when predicate matches nothing', () => {
      const result = setup(matchNone);

      expect(result.current.totalCount).toBe(0);
      expect(result.current.items).toHaveLength(0);
    });

    test('filters items by predicate', () => {
      const result = setup(matchABC);

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
      const result = setup();

      expect(result.current.currentData).toHaveLength(5);
      expect(result.current.currentData[0].name).toBe('Alice');
    });

    test('returns second page of items', () => {
      const result = setup(matchAll, 2);

      expect(result.current.currentData).toHaveLength(1);
      expect(result.current.currentData[0].name).toBe('Frank');
    });

    test('respects custom pageSize', () => {
      const result = setup(matchAll, 1, 2);

      expect(result.current.currentData).toHaveLength(2);
      expect(result.current.currentData.map(({ name }) => name)).toEqual([
        'Alice',
        'Bob',
      ]);
    });

    test('currentData reflects filtered + paginated items', () => {
      const result = setup(matchABC, 1, 2);

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
      const result = setup();

      expect(result.current.selection).toEqual([]);
    });

    test('setSelection updates the selection', () => {
      const result = setup();

      act(() => result.current.setSelection(['1', '2']));

      expect(result.current.selection).toEqual(['1', '2']);
    });

    test('clears selection when predicate reference changes', () => {
      let predicate = matchAll;
      const { result, rerender } = renderHook(() =>
        useTableState(items, predicate, 1, {}),
      );

      act(() => result.current.setSelection(['1', '2']));
      expect(result.current.selection).toEqual(['1', '2']);

      predicate = matchABC;
      rerender();

      expect(result.current.selection).toEqual([]);
    });

    test('preserves selection when predicate reference is stable', () => {
      let predicate = matchAll;
      const { result, rerender } = renderHook(() =>
        useTableState(items, predicate, 1, {}),
      );

      act(() => result.current.setSelection(['1']));

      rerender();

      expect(result.current.selection).toEqual(['1']);
    });

    test('preserves selection when only page changes', () => {
      let page = 1;
      const { result, rerender } = renderHook(() =>
        useTableState(items, matchAll, page),
      );

      act(() => result.current.setSelection(['1']));

      page = 2;
      rerender();

      expect(result.current.selection).toEqual(['1']);
    });
  });

  describe('toggleSelection', () => {
    test('toggleSelection adds an id once and removes it again', () => {
      expect(toggleSelection('1', true)([])).toEqual(['1']);
      expect(toggleSelection('1', true)(['1'])).toEqual(['1']);
      expect(toggleSelection('1', false)(['1', '2'])).toEqual(['2']);
    });
  });

  describe('removeSelected', () => {
    beforeEach(() => {
      mockToaster.create.mockClear();
      mockToaster.update.mockClear();
    });

    test('deletes every selected id, reports success and clears the selection', async () => {
      const remove = vi.fn().mockResolvedValue({ success: true, message: '' });
      const onDeleted = vi.fn();
      const result = setup();

      act(() => result.current.setSelection(['1', '2']));
      act(() => result.current.removeSelected(remove, 'item', onDeleted));

      expect(mockToaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'loading',
          title: 'Deleting 2 items...',
        }),
      );

      await waitFor(() => expect(result.current.selection).toEqual([]));
      expect(remove.mock.calls.map(([id]) => id)).toEqual(['1', '2']);
      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'success',
        title: 'Successfully deleted 2 items.',
        description: undefined,
      });
      expect(onDeleted).toHaveBeenCalled();
    });

    test('warns with the failure reasons on partial failure', async () => {
      const remove = vi
        .fn()
        .mockResolvedValueOnce({ success: true, message: '' })
        .mockResolvedValueOnce({ success: false, message: 'In use' });
      const result = setup();

      act(() => result.current.setSelection(['1', '2']));
      act(() => result.current.removeSelected(remove, 'match'));

      await waitFor(() => expect(result.current.selection).toEqual([]));
      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'warning',
        title: 'Deleted 1 of 2 matches; 1 failed.',
        description: 'In use',
      });
    });

    test('keeps the selection when nothing was deleted', async () => {
      const remove = vi
        .fn()
        .mockResolvedValue({ success: false, message: 'Forbidden' });
      const onDeleted = vi.fn();
      const result = setup();

      act(() => result.current.setSelection(['1']));
      act(() => result.current.removeSelected(remove, 'item', onDeleted));

      await waitFor(() =>
        expect(mockToaster.update).toHaveBeenCalledWith(
          'toast-id',
          expect.objectContaining({ type: 'warning' }),
        ),
      );
      expect(result.current.selection).toEqual(['1']);
      expect(onDeleted).not.toHaveBeenCalled();
    });
  });
});
