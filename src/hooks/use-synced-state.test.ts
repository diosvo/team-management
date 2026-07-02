import { act, renderHook } from '@testing-library/react';

import useSyncedState from './use-synced-state';

describe('useSyncedState', () => {
  test('initialises local state from the external value', () => {
    const { result } = renderHook(() => useSyncedState('hello'));

    const [value] = result.current;
    expect(value).toBe('hello');
  });

  test('local updates do not affect the external value', () => {
    const { result } = renderHook(() => useSyncedState('hello'));

    const [, setValue] = result.current;
    act(() => setValue('world'));

    const [value] = result.current;
    expect(value).toBe('world');
  });

  test('resyncs when the external value changes', () => {
    const { result, rerender } = renderHook(
      ({ external }: { external: string }) => useSyncedState(external),
      { initialProps: { external: 'a' } },
    );

    const [, setValue] = result.current;
    act(() => setValue('local-edit'));
    expect(result.current[0]).toBe('local-edit');

    rerender({ external: 'b' });

    const [value] = result.current;
    expect(value).toBe('b');
  });

  test('does not clobber local edits when the external value is unchanged', () => {
    const { result, rerender } = renderHook(
      ({ external }: { external: string }) => useSyncedState(external),
      { initialProps: { external: 'a' } },
    );

    const [, setValue] = result.current;
    act(() => setValue('local-edit'));
    rerender({ external: 'a' });

    const [value] = result.current;
    expect(value).toBe('local-edit');
  });

  test('compares by value, so an equal array rebuilt on each read does not resync', () => {
    const { result, rerender } = renderHook(
      ({ external }: { external: string[] }) => useSyncedState(external),
      { initialProps: { external: ['x', 'y'] } },
    );

    const [, setValue] = result.current;
    act(() => setValue(['local']));

    // New reference, same contents - must not resync.
    rerender({ external: ['x', 'y'] });
    expect(result.current[0]).toEqual(['local']);

    // Different contents - must resync.
    rerender({ external: ['z'] });
    expect(result.current[0]).toEqual(['z']);
  });
});
