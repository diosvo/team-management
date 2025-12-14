import { renderHook, waitFor } from '@testing-library/react';
import useQuery from './use-query';

describe('useQuery', () => {
  test('returns initial idle state when disabled', () => {
    const mockFn = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() =>
      useQuery(mockFn, [], { enabled: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('sets loading state while fetching', () => {
    const mockFn = vi.fn(() => new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useQuery(mockFn));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('returns data on successful fetch', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFn = vi.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useQuery(mockFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  test('returns error on failed fetch', async () => {
    const mockError = new Error('Fetch failed');
    const mockFn = vi.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useQuery(mockFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toEqual(mockError);
  });

  test('refetches when dependencies change', async () => {
    const mockFn = vi.fn((id: number) => Promise.resolve(`data-${id}`));
    let id = 1;

    const { result, rerender } = renderHook(
      ({ id }) => useQuery(() => mockFn(id), [id]),
      { initialProps: { id } },
    );

    await waitFor(() => {
      expect(result.current.data).toBe('data-1');
    });

    expect(mockFn).toHaveBeenCalledTimes(1);

    // Change dependency
    id = 2;
    rerender({ id });

    await waitFor(() => {
      expect(result.current.data).toBe('data-2');
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('does not fetch when enabled is false', () => {
    const mockFn = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() =>
      useQuery(mockFn, [], { enabled: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockFn).not.toHaveBeenCalled();
  });

  test('fetches when enabled changes from false to true', async () => {
    const mockFn = vi.fn(() => Promise.resolve('data'));
    let enabled = false;

    const { result, rerender } = renderHook(
      ({ enabled }) => useQuery(mockFn, [], { enabled }),
      { initialProps: { enabled } },
    );

    expect(mockFn).not.toHaveBeenCalled();

    // Enable query
    enabled = true;
    rerender({ enabled });

    await waitFor(() => {
      expect(result.current.data).toBe('data');
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('resets to idle state when enabled changes to false', async () => {
    const mockFn = vi.fn(() => Promise.resolve('data'));
    let enabled = true;

    const { result, rerender } = renderHook(
      ({ enabled }) => useQuery(mockFn, [], { enabled }),
      { initialProps: { enabled } },
    );

    await waitFor(() => {
      expect(result.current.data).toBe('data');
    });

    // Disable query
    enabled = false;
    rerender({ enabled });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('cancels ongoing request when unmounted', async () => {
    let resolveFn: (value: string) => void;
    const mockFn = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFn = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useQuery(mockFn));

    expect(result.current.loading).toBe(true);

    const loadingBeforeUnmount = result.current.loading;
    unmount();

    // Resolve after unmount
    resolveFn!('data');

    // Wait a bit to ensure no state update happens
    await new Promise((resolve) => setTimeout(resolve, 10));

    // State should still be what it was before unmount
    expect(loadingBeforeUnmount).toBe(true);
  });

  test('ignores error when unmounted', async () => {
    let rejectFn: (error: Error) => void;
    const mockFn = vi.fn(
      () =>
        new Promise<string>((_, reject) => {
          rejectFn = reject;
        }),
    );

    const { result, unmount } = renderHook(() => useQuery(mockFn));

    expect(result.current.loading).toBe(true);

    const errorBeforeUnmount = result.current.error;
    unmount();

    // Reject after unmount
    rejectFn!(new Error('Fetch failed'));

    // Wait a bit to ensure no state update happens
    await new Promise((resolve) => setTimeout(resolve, 10));

    // State should still be what it was before unmount (no error set)
    expect(errorBeforeUnmount).toBe(null);
  });

  test('cancels ongoing request when dependencies change', async () => {
    let resolveFns: Array<() => void> = [];
    const mockFn = vi.fn(
      (id: number) =>
        new Promise<string>((resolve) => {
          resolveFns.push(() => resolve(`data-${id}`));
        }),
    );

    let id = 1;
    const { result, rerender } = renderHook(
      ({ id }) => useQuery(() => mockFn(id), [id]),
      { initialProps: { id } },
    );

    expect(result.current.loading).toBe(true);

    // Change dependency before first request resolves
    id = 2;
    rerender({ id });

    // Resolve first request (should be ignored)
    resolveFns[0]();

    // Resolve second request
    resolveFns[1]();

    await waitFor(() => {
      expect(result.current.data).toBe('data-2');
    });

    // Should only have the second result, not the first
    expect(result.current.data).not.toBe('data-1');
  });

  test('ignores error when dependencies change', async () => {
    let rejectFns: Array<(error: Error) => void> = [];
    const mockFn = vi.fn(
      (id: number) =>
        new Promise<string>((_, reject) => {
          rejectFns.push((error: Error) => reject(error));
        }),
    );

    let id = 1;
    const { result, rerender } = renderHook(
      ({ id }) => useQuery(() => mockFn(id), [id]),
      { initialProps: { id } },
    );

    expect(result.current.loading).toBe(true);

    // Change dependency before first request rejects
    id = 2;
    rerender({ id });

    // Reject first request (should be ignored)
    rejectFns[0](new Error('First error'));

    // Reject second request (should be captured)
    rejectFns[1](new Error('Second error'));

    await waitFor(() => {
      expect(result.current.error?.message).toBe('Second error');
    });

    // Should only have the second error, not the first
    expect(result.current.error?.message).not.toBe('First error');
  });

  test('handles multiple data types', async () => {
    // Test with number
    const numberFn = vi.fn(() => Promise.resolve(42));
    const { result: numberResult } = renderHook(() => useQuery(numberFn));

    await waitFor(() => {
      expect(numberResult.current.data).toBe(42);
    });

    // Test with array
    const arrayFn = vi.fn(() => Promise.resolve([1, 2, 3]));
    const { result: arrayResult } = renderHook(() => useQuery(arrayFn));

    await waitFor(() => {
      expect(arrayResult.current.data).toEqual([1, 2, 3]);
    });

    // Test with object
    const objectFn = vi.fn(() => Promise.resolve({ key: 'value' }));
    const { result: objectResult } = renderHook(() => useQuery(objectFn));

    await waitFor(() => {
      expect(objectResult.current.data).toEqual({ key: 'value' });
    });
  });

  test('works with empty dependencies array', async () => {
    const mockFn = vi.fn(() => Promise.resolve('data'));
    const { result, rerender } = renderHook(() => useQuery(mockFn, []));

    await waitFor(() => {
      expect(result.current.data).toBe('data');
    });

    expect(mockFn).toHaveBeenCalledTimes(1);

    // Rerender without changing anything
    rerender();

    // Should not call again
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
