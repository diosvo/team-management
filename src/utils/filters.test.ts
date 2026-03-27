import { renderHook } from '@testing-library/react';
import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_ATTENDANCE_DATE } from '@/test/mocks/attendance';

import { ALL, INTERVAL_VALUES, SESSION_STATUS_VALUES } from './constant';
import { AttendanceStatus, Interval, SessionStatus } from './enum';

import {
  loadAnalyticsFilters,
  loadAttendanceFilters,
  loadMatchFilters,
  loadPeriodicTestingFilters,
  loadTrainingFilters,
  paginateData,
  useAssetFilters,
  useAttendanceFilters,
  useCommonParams,
  useDashboardFilters,
  useLeagueFilters,
  useMatchFilters,
  usePeriodicTestingFilters,
  useRosterFilters,
  useTrainingFilters,
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

  describe('useRosterFilters', () => {
    test('calls useQueryStates with roster params', () => {
      const mockReturn = [{ page: 1, q: '', role: [], state: [] }, vi.fn()];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useRosterFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          role: expect.anything(),
          state: expect.anything(),
        }),
      );
      expect(result.current).toBe(mockReturn);
    });
  });

  describe('useAssetFilters', () => {
    test('calls useQueryStates with asset params', () => {
      const mockReturn = [
        { page: 1, q: '', category: ALL.value, condition: ALL.value },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useAssetFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          category: expect.anything(),
          condition: expect.anything(),
        }),
      );
      expect(result.current).toBe(mockReturn);
    });
  });

  describe('useLeagueFilters', () => {
    test('calls useQueryStates with league params', () => {
      const mockReturn = [{ page: 1, q: '', status: ALL.value }, vi.fn()];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useLeagueFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          status: expect.anything(),
        }),
      );
      expect(result.current).toBe(mockReturn);
    });
  });

  describe('useMatchFilters', () => {
    test('calls useQueryStates with match params', () => {
      const mockReturn = [
        { page: 1, q: '', is5x5: true, interval: Interval.THIS_YEAR },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useMatchFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          is5x5: expect.anything(),
          interval: expect.anything(),
        }),
      );
      expect(result.current).toBe(mockReturn);
    });
  });

  describe('useAttendanceFilters', () => {
    test('calls useQueryStates with attendance params and shallow: false', () => {
      const mockReturn = [
        { page: 1, q: '', date: '', status: ALL.value },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useAttendanceFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          date: expect.anything(),
          status: expect.anything(),
        }),
        { shallow: false },
      );
      expect(result.current).toBe(mockReturn);
    });
  });

  describe('useTrainingFilters', () => {
    test('calls useQueryStates with training params and shallow: false', () => {
      const mockReturn = [
        { page: 1, q: '', interval: Interval.THIS_MONTH, status: ALL.value },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useTrainingFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          interval: expect.anything(),
          status: expect.anything(),
        }),
        { shallow: false },
      );
      expect(result.current).toBe(mockReturn);
    });
  });

  describe('useDashboardFilters', () => {
    test('calls useQueryStates with analytics params and shallow: false', () => {
      const mockReturn = [
        { page: 1, q: '', interval: Interval.THIS_MONTH },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useDashboardFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          interval: expect.anything(),
        }),
        { shallow: false },
      );
      expect(result.current).toBe(mockReturn);
    });
  });

  describe('usePeriodicTestingFilters', () => {
    test('calls useQueryStates with periodic testing params and shallow: false', () => {
      const mockReturn = [{ page: 1, q: '', date: '' }, vi.fn()];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => usePeriodicTestingFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          date: expect.anything(),
        }),
        { shallow: false },
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
          date: expect.any(String),
          status: ALL.value,
        }),
      );
    });

    test('loads attendance filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '4',
        q: 'dios',
        date: MOCK_ATTENDANCE_DATE,
        status: AttendanceStatus.ABSENT,
      });
      const result = await loadAttendanceFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 4,
          q: 'dios',
          date: MOCK_ATTENDANCE_DATE,
          status: AttendanceStatus.ABSENT,
        }),
      );
    });

    test('handles multiple status values correctly', async () => {
      const result = await loadAttendanceFilters(
        new URLSearchParams({ status: AttendanceStatus.ON_TIME }),
      );

      expect(result).toEqual(
        expect.objectContaining({ status: AttendanceStatus.ON_TIME }),
      );
    });

    test('uses default status when invalid value provided', async () => {
      const result = await loadAttendanceFilters(
        new URLSearchParams({ status: 'invalid_status' }),
      );

      expect(result).toEqual(expect.objectContaining({ status: ALL.value }));
    });
  });

  describe('loadAnalyticsFilters', () => {
    test('loads analytics filters with default values', async () => {
      const result = await loadAnalyticsFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          interval: Interval.THIS_MONTH,
        }),
      );
    });

    test('loads analytics filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '3',
        q: 'dios',
        interval: Interval.THIS_YEAR,
      });
      const result = await loadAnalyticsFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 3,
          q: 'dios',
          interval: Interval.THIS_YEAR,
        }),
      );
    });

    test('handles all interval values correctly', async () => {
      for (const interval of INTERVAL_VALUES) {
        const result = await loadAnalyticsFilters(
          new URLSearchParams({ interval }),
        );
        expect(result).toEqual(expect.objectContaining({ interval }));
      }
    });

    test('uses default interval when invalid value provided', async () => {
      const result = await loadAnalyticsFilters(
        new URLSearchParams({ interval: 'invalid_interval' }),
      );

      expect(result).toEqual(
        expect.objectContaining({ interval: Interval.THIS_MONTH }),
      );
    });
  });

  describe('loadPeriodicTestingFilters', () => {
    test('loads periodic testing filters with default values', async () => {
      const result = await loadPeriodicTestingFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          date: '',
        }),
      );
    });

    test('loads periodic testing filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '2',
        q: 'sprint',
        date: '2026-03-01',
      });
      const result = await loadPeriodicTestingFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 2,
          q: 'sprint',
          date: '2026-03-01',
        }),
      );
    });
  });

  describe('loadMatchFilters', () => {
    test('loads match filters with default values', async () => {
      const result = await loadMatchFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          is5x5: true,
          interval: Interval.THIS_YEAR,
        }),
      );
    });

    test('loads match filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '2',
        q: 'finals',
        is5x5: 'false',
        interval: Interval.LAST_YEAR,
      });
      const result = await loadMatchFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 2,
          q: 'finals',
          is5x5: false,
          interval: Interval.LAST_YEAR,
        }),
      );
    });

    test('uses default interval when invalid value provided', async () => {
      const result = await loadMatchFilters(
        new URLSearchParams({ interval: 'invalid_interval' }),
      );

      expect(result).toEqual(
        expect.objectContaining({ interval: Interval.THIS_YEAR }),
      );
    });
  });

  describe('loadTrainingFilters', () => {
    test('loads training filters with default values', async () => {
      const result = await loadTrainingFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          interval: Interval.THIS_MONTH,
          status: ALL.value,
        }),
      );
    });

    test('loads training filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '5',
        q: 'cardio',
        interval: Interval.LAST_MONTH,
        status: SessionStatus.COMPLETED,
      });
      const result = await loadTrainingFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 5,
          q: 'cardio',
          interval: Interval.LAST_MONTH,
          status: SessionStatus.COMPLETED,
        }),
      );
    });

    test('handles all session status values correctly', async () => {
      for (const status of SESSION_STATUS_VALUES) {
        const result = await loadTrainingFilters(
          new URLSearchParams({ status }),
        );
        expect(result).toEqual(expect.objectContaining({ status }));
      }
    });

    test('uses default status when invalid value provided', async () => {
      const result = await loadTrainingFilters(
        new URLSearchParams({ status: 'invalid_status' }),
      );

      expect(result).toEqual(expect.objectContaining({ status: ALL.value }));
    });

    test('uses default interval when invalid value provided', async () => {
      const result = await loadTrainingFilters(
        new URLSearchParams({ interval: 'invalid_interval' }),
      );

      expect(result).toEqual(
        expect.objectContaining({ interval: Interval.THIS_MONTH }),
      );
    });
  });
});
