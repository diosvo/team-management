import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { act, renderHook } from '@/test/utilities';

import { recordVisit, useRecentPages } from './recent-pages';

const STORAGE_KEY = 'global-search:recent';
const store = new Map<string, string>();

// Node's own (file-less) `localStorage` shadows jsdom's, so stand in for it.
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
});

describe('recent pages', () => {
  beforeEach(() => store.clear());

  test('starts empty', () => {
    const { result } = renderHook(() => useRecentPages());

    expect(result.current).toEqual([]);
  });

  test('keeps the latest 4 visits, most recent first and without repeats', () => {
    const { result } = renderHook(() => useRecentPages());

    act(() => {
      ['roster', 'training', 'matches', 'roster', 'teams', 'assets'].forEach(
        recordVisit,
      );
    });

    expect(result.current).toEqual(['assets', 'teams', 'roster', 'matches']);
    expect(JSON.parse(store.get(STORAGE_KEY)!)).toEqual(result.current);
  });

  test('returns the same snapshot while storage is unchanged', () => {
    store.set(STORAGE_KEY, '["roster"]');
    const { result, rerender } = renderHook(() => useRecentPages());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  test.each([
    ['invalid JSON', '{'],
    ['a non-array', '{"id":"roster"}'],
  ])('falls back to empty on %s', (_, raw) => {
    store.set(STORAGE_KEY, raw);

    const { result } = renderHook(() => useRecentPages());

    expect(result.current).toEqual([]);
  });

  test('drops entries that are not ids', () => {
    store.set(STORAGE_KEY, '["roster", 1, null, "teams"]');

    const { result } = renderHook(() => useRecentPages());

    expect(result.current).toEqual(['roster', 'teams']);
  });

  test('picks up changes from other tabs', () => {
    const { result, unmount } = renderHook(() => useRecentPages());

    act(() => {
      store.set(STORAGE_KEY, '["leagues"]');
      window.dispatchEvent(new StorageEvent('storage'));
    });
    expect(result.current).toEqual(['leagues']);

    unmount();
  });

  test('renders empty on the server', () => {
    store.set(STORAGE_KEY, '["roster"]');
    function Recent() {
      return useRecentPages().join(',') || 'none';
    }

    expect(renderToString(createElement(Recent))).toBe('none');
  });
});
