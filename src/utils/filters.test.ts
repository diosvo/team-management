import { renderHook } from '@testing-library/react';
import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_ATTENDANCE_DATE } from '@/test/mocks/attendance';

import { ALL } from './constant';
import { AttendanceStatus } from './enum';

import {
  loadAttendanceFilters,
  paginateData,
  useCommonParams,
} from './filters';

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

/* ================== Client-Side Hooks ================== */

describe('Client-Side Filter Hooks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useCommonParams', () => {
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
});

/* ================== Server-Side Loaders ================== */

describe('Server-Side Filter Loaders', () => {
  describe('loadAttendanceFilters', () => {
    test('loads attendance filters with default values', async () => {
      const result = await loadAttendanceFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          status: ALL.value,
        }),
      );
      expect(result.date).toBeDefined(); // CURRENT_DATE is injected
    });

    test('loads attendance filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '4',
        q: 'dios',
        date: MOCK_ATTENDANCE_DATE,
        status: AttendanceStatus.ABSENT,
      });
      const result = await loadAttendanceFilters(params);

      expect(result.page).toBe(4);
      expect(result.q).toBe('dios');
      expect(result.date).toBe(MOCK_ATTENDANCE_DATE);
      expect(result.status).toBe(AttendanceStatus.ABSENT);
    });

    test('handles multiple status values correctly', async () => {
      const result = await loadAttendanceFilters(
        new URLSearchParams({ status: AttendanceStatus.ON_TIME }),
      );

      expect(result.status).toBe(AttendanceStatus.ON_TIME);
    });

    test('uses default status when invalid value provided', async () => {
      const result = await loadAttendanceFilters(
        new URLSearchParams({ status: 'invalid_status' }),
      );

      expect(result.status).toBe(ALL.value);
    });
  });
});
