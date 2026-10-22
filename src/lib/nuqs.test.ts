import { renderHook } from '@testing-library/react';
import * as nuqs from 'nuqs';
import type { Mock } from 'vitest';

import { MOCK_ATTENDANCE_DATE } from '@/test/mocks/attendance';

import { ALL, SESSION_STATUS_VALUES } from '@/utils/constants';
import { thisDay, thisMonth, thisYear } from '@/utils/datetime';
import {
  AttendanceStatus,
  MatchStatus,
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
        from: '',
        to: '',
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
        { page: 1, q: '', game_type: [], ...thisYear() },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useMatchFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          game_type: expect.anything(),
          from: expect.anything(),
          to: expect.anything(),
        }),
        {},
      );
      expect(result.current).toEqual(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useMatchFilters.defaults).toEqual({
        page: 1,
        q: '',
        game_type: [],
        ...thisYear(),
        match_type: [],
        status: [],
      });
    });
  });

  describe('useAttendanceFilters', () => {
    test('calls useQueryStates with attendance params and shallow: false', () => {
      const mockReturn = [
        { page: 1, q: '', ...thisDay(), status: ALL.value },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useAttendanceFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          from: expect.anything(),
          to: expect.anything(),
          status: expect.anything(),
        }),
        { shallow: false },
      );
      expect(result.current).toEqual(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useAttendanceFilters.defaults).toEqual({
        page: 1,
        q: '',
        ...thisDay(),
        status: [],
      });
    });

    test('resolves the default window when read, not at module load', async () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date('2030-03-15T12:00:00'));
        expect(useAttendanceFilters.defaults).toMatchObject({
          from: '2030-03-15',
          to: '2030-03-15',
        });
        await expect(
          loadAttendanceFilters(new URLSearchParams()),
        ).resolves.toMatchObject({ from: '2030-03-15', to: '2030-03-15' });
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('useTrainingFilters', () => {
    test('calls useQueryStates with training params and shallow: false', () => {
      const mockReturn = [
        { page: 1, q: '', ...thisYear(), status: ALL.value },
        vi.fn(),
      ];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useTrainingFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          from: expect.anything(),
          to: expect.anything(),
          status: expect.anything(),
        }),
        { shallow: false },
      );
      expect(result.current).toEqual(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useTrainingFilters.defaults).toEqual({
        page: 1,
        q: '',
        ...thisYear(),
        status: [],
      });
    });
  });

  describe('useDashboardFilters', () => {
    test('calls useQueryStates with analytics params and shallow: false', () => {
      const mockReturn = [{ page: 1, q: '', ...thisMonth() }, vi.fn()];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => useDashboardFilters());

      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          from: expect.anything(),
          to: expect.anything(),
        }),
        { shallow: false },
      );
      expect(result.current).toEqual(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(useDashboardFilters.defaults).toEqual({
        page: 1,
        q: '',
        ...thisYear(),
      });
    });
  });

  describe('usePeriodicTestingFilters', () => {
    test('calls useQueryStates with periodic testing params (shallow by default)', () => {
      const mockReturn = [{ page: 1, q: '', date: '' }, vi.fn()];
      (nuqs.useQueryStates as unknown as Mock).mockReturnValue(mockReturn);

      const { result } = renderHook(() => usePeriodicTestingFilters());

      // Client-only by default; only the date change opts into a server
      // round-trip via a per-call `{ shallow: false }` override.
      expect(nuqs.useQueryStates).toHaveBeenCalledWith(
        expect.objectContaining({
          page: expect.anything(),
          q: expect.anything(),
          date: expect.anything(),
        }),
        {},
      );
      expect(result.current).toBe(mockReturn);
    });

    test('exposes correct defaults', () => {
      expect(usePeriodicTestingFilters.defaults).toEqual({
        page: 1,
        q: '',
        date: '',
        type: [],
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

describe('Range filter windows', () => {
  // The hook and the loader must default to the same window, or the server
  // renders one window while the picker shows another (and won't re-emit it).
  test.each([
    ['match', useMatchFilters, loadMatchFilters],
    ['attendance', useAttendanceFilters, loadAttendanceFilters],
    ['training', useTrainingFilters, loadTrainingFilters],
    ['dashboard', useDashboardFilters, loadDashboardFilters],
  ] as const)(
    '%s hook and loader share a default window',
    async (_, hook, load) => {
      const { from, to } = await load(new URLSearchParams());
      expect(hook.defaults).toMatchObject({ from, to });
    },
  );
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
          ...thisDay(),
          status: [],
        }),
      );
    });

    test('loads attendance filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '4',
        q: 'dios',
        from: MOCK_ATTENDANCE_DATE,
        to: MOCK_ATTENDANCE_DATE,
        status: AttendanceStatus.ABSENT,
      });
      const result = await loadAttendanceFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 4,
          q: 'dios',
          from: MOCK_ATTENDANCE_DATE,
          to: MOCK_ATTENDANCE_DATE,
          status: [AttendanceStatus.ABSENT],
        }),
      );
    });

    test('handles multiple status values correctly', async () => {
      const result = await loadAttendanceFilters(
        new URLSearchParams({
          status: `${AttendanceStatus.ON_TIME},${AttendanceStatus.LATE}`,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          status: [AttendanceStatus.ON_TIME, AttendanceStatus.LATE],
        }),
      );
    });

    test('uses default status when invalid value provided', async () => {
      const result = await loadAttendanceFilters(
        new URLSearchParams({ status: 'invalid_status' }),
      );

      expect(result).toEqual(expect.objectContaining({ status: [] }));
    });
  });

  describe('loadDashboardFilters', () => {
    test('loads analytics filters with default values', async () => {
      const result = await loadDashboardFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          ...thisYear(),
        }),
      );
    });

    test('loads analytics filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '3',
        q: 'dios',
        ...thisYear(),
      });
      const result = await loadDashboardFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 3,
          q: 'dios',
          ...thisYear(),
        }),
      );
    });

    test('carries an arbitrary window, not just a named period', async () => {
      const result = await loadDashboardFilters(
        new URLSearchParams({ from: '2026-03-04', to: '2026-03-18' }),
      );

      expect(result).toEqual(
        expect.objectContaining({ from: '2026-03-04', to: '2026-03-18' }),
      );
    });

    test('falls back to this year when the window is absent', async () => {
      const result = await loadDashboardFilters(new URLSearchParams());

      expect(result).toEqual(expect.objectContaining(thisYear()));
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
          ...thisYear(),
          match_type: [],
        }),
      );
    });

    test('loads match filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '2',
        q: 'finals',
        game_type: 'false',
        from: '2025-01-01',
        to: '2025-12-31',
      });
      const result = await loadMatchFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 2,
          q: 'finals',
          game_type: ['false'],
          from: '2025-01-01',
          to: '2025-12-31',
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

    test('parses the selected match statuses', async () => {
      const result = await loadMatchFilters(
        new URLSearchParams({
          status: `${MatchStatus.SCHEDULED},${MatchStatus.CANCELLED}`,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          status: [MatchStatus.SCHEDULED, MatchStatus.CANCELLED],
        }),
      );
    });

    test('drops an unknown match status', async () => {
      const result = await loadMatchFilters(
        new URLSearchParams({ status: 'live' }),
      );

      expect(result).toEqual(expect.objectContaining({ status: [] }));
    });

    test('falls back to this year when the window is absent', async () => {
      const result = await loadMatchFilters(new URLSearchParams());

      expect(result).toEqual(expect.objectContaining(thisYear()));
    });
  });

  describe('loadTrainingFilters', () => {
    test('loads training filters with default values', async () => {
      const result = await loadTrainingFilters(new URLSearchParams());

      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          q: '',
          ...thisYear(),
          status: [],
        }),
      );
    });

    test('loads training filters with provided values', async () => {
      const params = new URLSearchParams({
        page: '5',
        q: 'cardio',
        from: '2026-01-01',
        to: '2026-01-31',
        status: SessionStatus.COMPLETED,
      });
      const result = await loadTrainingFilters(params);

      expect(result).toEqual(
        expect.objectContaining({
          page: 5,
          q: 'cardio',
          from: '2026-01-01',
          to: '2026-01-31',
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

    test('falls back to this year when the window is absent', async () => {
      const result = await loadTrainingFilters(new URLSearchParams());

      expect(result).toEqual(expect.objectContaining(thisYear()));
    });
  });
});
