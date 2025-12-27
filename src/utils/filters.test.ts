import { renderHook } from '@testing-library/react';
import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { paginateData, useCommonParams } from './filters';

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

describe('useCommonParams', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('calls useQueryStates with commonParams and default options', () => {
    const mockReturn = { page: 1, q: '' };
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

    const { result } = renderHook(() => useCommonParams());

    expect(nuqs.useQueryStates).toHaveBeenCalledWith(
      expect.objectContaining({
        page: expect.anything(),
        q: expect.anything(),
      }),
      {},
    );
    expect(result.current).toBe(mockReturn);
  });

  test('calls useQueryStates with provided options', () => {
    const mockReturn = { page: 2, q: 'test' };
    const options = { shallow: true };
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

    const { result } = renderHook(() => useCommonParams(options));

    expect(nuqs.useQueryStates).toHaveBeenCalledWith(
      expect.objectContaining({
        page: expect.anything(),
        q: expect.anything(),
      }),
      options,
    );
    expect(result.current).toBe(mockReturn);
  });
});
