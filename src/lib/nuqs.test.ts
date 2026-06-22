import { renderHook } from '@testing-library/react';
import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_ATTENDANCE_DATE } from '@/test/mocks/attendance';

import {
  ALL,
  CURRENT_DATE,
  INTERVAL_VALUES,
  SESSION_STATUS_VALUES,
} from '@/utils/constant';
import {
  AttendanceStatus,
  Interval,
  MatchType,
  SessionStatus,
} from '@/utils/enum';

import {
  getDefaults,
  loadAttendanceFilters,
  loadDashboardFilters,
  loadMatchFilters,
  loadPeriodicTestingFilters,
  loadTrainingFilters,
  useAssetFilters,
  useAttendanceFilters,
  useCommonParams,
  useDashboardFilters,
  useLeagueFilters,
  useMatchFilters,
  usePeriodicTestingFilters,
  useRosterFilters,
  useTrainingFilters,
} from './nuqs';

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
        {},
      );
      expect(result.current).toBe(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useRosterFilters.defaults).toEqual({
        page: 1,
        q: '',
        role: [],
        state: [],
      });
    });
  });

  describe('useAssetFilters', () => {
    test('calls useQueryStates with asset params', () => {
      const mockReturn = [
        { page: 1, q: '', category: [], condition: [] },
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
        {},
      );
      expect(result.current).toBe(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useAssetFilters.defaults).toEqual({
        page: 1,
        q: '',
        category: [],
        condition: [],
      });
    });
  });

  describe('useLeagueFilters', () => {
    test('calls useQueryStates with league params', () => {
      const mockReturn = [{ page: 1, q: '', status: [] }, vi.fn()];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useLeagueFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          status: expect.anything(),
        }),
        {},
      );
      expect(result.current).toBe(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useLeagueFilters.defaults).toEqual({
        page: 1,
        q: '',
        status: [],
      });
    });
  });

  describe('useMatchFilters', () => {
    test('calls useQueryStates with match params', () => {
      const mockReturn = [
        { page: 1, q: '', game_type: [], interval: Interval.THIS_YEAR },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useMatchFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          game_type: expect.anything(),
          interval: expect.anything(),
        }),
        {},
      );
      expect(result.current).toBe(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useMatchFilters.defaults).toEqual({
        page: 1,
        q: '',
        game_type: [],
        interval: Interval.THIS_YEAR,
        match_type: [],
      });
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

    test('exposes correct defaults', () => {
      expect(useAttendanceFilters.defaults).toEqual({
        page: 1,
        q: '',
        date: CURRENT_DATE,
        status: ALL.value,
      });
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

    test('exposes correct defaults', () => {
      expect(useTrainingFilters.defaults).toEqual({
        page: 1,
        q: '',
        interval: Interval.THIS_MONTH,
        status: [],
      });
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

    test('exposes correct defaults', () => {
      expect(useDashboardFilters.defaults).toEqual({
        page: 1,
        q: '',
        interval: Interval.THIS_YEAR,
      });
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

    test('exposes correct defaults', () => {
      expect(usePeriodicTestingFilters.defaults).toEqual({
        page: 1,
        q: '',
        date: '',
      });
    });
  });

  describe('getDefaults', () => {
    test('extracts defaultValue from each parser', () => {
      const { parseAsInteger, parseAsString } = require('nuqs/server');
      const params = {
        count: parseAsInteger.withDefault(5),
        name: parseAsString.withDefault('hello'),
      };
      expect(getDefaults(params)).toEqual({ count: 5, name: 'hello' });
    });

    test('returns empty array defaults for array parsers', () => {
      const { parseAsArrayOf, parseAsString } = require('nuqs/server');
      const params = {
        tags: parseAsArrayOf(parseAsString).withDefault([]),
      };
      expect(getDefaults(params)).toEqual({ tags: [] });
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

  describe('loadDashboardFilters', () => {
    test('loads analytics filters with default values', async () => {
      const result = await loadDashboardFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          interval: Interval.THIS_YEAR,
        }),
      );
    });

    test('loads analytics filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '3',
        q: 'dios',
        interval: Interval.THIS_YEAR,
      });
      const result = await loadDashboardFilters(params);

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
        const result = await loadDashboardFilters(
          new URLSearchParams({ interval }),
        );
        expect(result).toEqual(expect.objectContaining({ interval }));
      }
    });

    test('uses default interval when invalid value provided', async () => {
      const result = await loadDashboardFilters(
        new URLSearchParams({ interval: 'invalid_interval' }),
      );

      expect(result).toEqual(
        expect.objectContaining({ interval: Interval.THIS_YEAR }),
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
          game_type: [],
          interval: Interval.THIS_YEAR,
          match_type: [],
        }),
      );
    });

    test('loads match filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '2',
        q: 'finals',
        game_type: 'false',
        interval: Interval.LAST_YEAR,
      });
      const result = await loadMatchFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 2,
          q: 'finals',
          game_type: ['false'],
          interval: Interval.LAST_YEAR,
        }),
      );
    });

    test('parses multiple game_type and match_type values', async () => {
      const params = new URLSearchParams({
        game_type: 'true,false',
        match_type: `${MatchType.LEAGUE},${MatchType.FRIENDLY}`,
      });
      const result = await loadMatchFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          game_type: ['true', 'false'],
          match_type: [MatchType.LEAGUE, MatchType.FRIENDLY],
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
          status: [],
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
          status: [SessionStatus.COMPLETED],
        }),
      );
    });

    test('handles all session status values correctly', async () => {
      for (const status of SESSION_STATUS_VALUES.filter(
        (s) => s !== ALL.value,
      )) {
        const result = await loadTrainingFilters(
          new URLSearchParams({ status }),
        );
        expect(result).toEqual(expect.objectContaining({ status: [status] }));
      }
    });

    test('uses default status when invalid value provided', async () => {
      const result = await loadTrainingFilters(
        new URLSearchParams({ status: 'invalid_status' }),
      );

      expect(result).toEqual(expect.objectContaining({ status: [] }));
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
