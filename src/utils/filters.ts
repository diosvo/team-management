import { useQueryStates } from 'nuqs';
import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  type Options,
} from 'nuqs/server';

import {
  ALL,
  ASSET_CATEGORY_VALUES,
  ASSET_CONDITION_VALUES,
  ATTENDANCE_STATUS_VALUES,
  CURRENT_DATE,
  INTERVAL_VALUES,
  LEAGUE_STATUS_VALUES,
  SELECTABLE_USER_ROLES,
  SELECTABLE_USER_STATES,
} from './constant';
import { Interval } from './enum';

// For CSR only
export const commonParams = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
};

const rosterSearchParams = {
  ...commonParams,
  role: parseAsArrayOf(parseAsStringEnum(SELECTABLE_USER_ROLES)).withDefault(
    [],
  ),
  state: parseAsArrayOf(parseAsStringEnum(SELECTABLE_USER_STATES)).withDefault(
    [],
  ),
};

const assetSearchParams = {
  ...commonParams,
  category: parseAsStringEnum(ASSET_CATEGORY_VALUES).withDefault(ALL.value),
  condition: parseAsStringEnum(ASSET_CONDITION_VALUES).withDefault(ALL.value),
};

const periodicTestingSearchParams = {
  ...commonParams,
  date: parseAsString.withDefault(''),
};

const leagueSearchParams = {
  ...commonParams,
  status: parseAsStringEnum(LEAGUE_STATUS_VALUES).withDefault(ALL.value),
};

const matchSearchParams = {
  ...commonParams,
  is5x5: parseAsBoolean.withDefault(true),
  interval: parseAsStringEnum(INTERVAL_VALUES).withDefault(Interval.THIS_YEAR),
};

const attendanceSearchParams = {
  ...commonParams,
  date: parseAsString.withDefault(CURRENT_DATE),
  status: parseAsStringEnum(ATTENDANCE_STATUS_VALUES).withDefault(ALL.value),
};

/* 👯‍♂️ Client 👯‍♂️ */
export const useCommonParams = (options: Options = {}) =>
  useQueryStates(commonParams, options);
export const useRosterFilters = () => useQueryStates(rosterSearchParams);
export const useAssetFilters = () => useQueryStates(assetSearchParams);
export const usePeriodicTestingFilters = () =>
  useQueryStates(periodicTestingSearchParams, {
    shallow: false,
  });
export const useLeagueFilters = () => useQueryStates(leagueSearchParams);
export const useMatchFilters = () => useQueryStates(matchSearchParams);
export const useAttendanceFilters = () =>
  useQueryStates(attendanceSearchParams, {
    shallow: false,
  });

/* 🌩️ Server 🌩️ */
export const loadPeriodicTestingFilters = createLoader(
  periodicTestingSearchParams,
);
export const loadMatchFilters = createLoader(matchSearchParams);
export const loadAttendanceFilters = createLoader(attendanceSearchParams);

export type MatchSearchParams = Awaited<ReturnType<typeof loadMatchFilters>>;
export type MatchSearchParamsKeys = keyof typeof matchSearchParams;
export type AttendanceSearchParams = Awaited<
  ReturnType<typeof loadAttendanceFilters>
>;

export function paginateData<T>(
  data: Array<T>,
  page: number,
  pageSize: number = 5,
): Array<T> {
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, data.length);

  return data.slice(start, end);
}
