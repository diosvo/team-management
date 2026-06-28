import { useQueryStates, type UseQueryStatesKeysMap } from 'nuqs';
import {
  createLoader,
  inferParserType,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  type Options,
} from 'nuqs/server';

import {
  CURRENT_DATE,
  INTERVAL_VALUES,
  SELECTABLE_ASSET_CATEGORIES,
  SELECTABLE_ASSET_CONDITIONS,
  SELECTABLE_ATTENDANCE_STATUS,
  SELECTABLE_EMAIL_STATUS,
  SELECTABLE_GAME_TYPES,
  SELECTABLE_LEAGUE_STATUS,
  SELECTABLE_MATCH_TYPES,
  SELECTABLE_SESSION_STATUS,
  SELECTABLE_TEST_TYPES,
  SELECTABLE_USER_ROLES,
  SELECTABLE_USER_STATES,
} from '@/utils/constant';
import { Interval } from '@/utils/enum';

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

export const assetSearchParams = {
  ...commonParams,
  category: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_ASSET_CATEGORIES]),
  ).withDefault([]),
  condition: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_ASSET_CONDITIONS]),
  ).withDefault([]),
};

const periodicTestingSearchParams = {
  ...commonParams,
  date: parseAsString.withDefault(''),
  // Test type names to display as columns (empty = show all). Dynamic per date,
  // so parsed as free-form strings rather than a fixed enum.
  type: parseAsArrayOf(parseAsString).withDefault([]),
};

const testTypeSearchParams = {
  ...commonParams,
  unit: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_TEST_TYPES]),
  ).withDefault([]),
};

const leagueSearchParams = {
  ...commonParams,
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_LEAGUE_STATUS]),
  ).withDefault([]),
};

export const matchSearchParams = {
  ...commonParams,
  game_type: parseAsArrayOf(
    parseAsStringEnum(SELECTABLE_GAME_TYPES),
  ).withDefault([]),
  interval: parseAsStringEnum(INTERVAL_VALUES).withDefault(Interval.THIS_YEAR),
  match_type: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_MATCH_TYPES]),
  ).withDefault([]),
};

const attendanceSearchParams = {
  ...commonParams,
  date: parseAsString.withDefault(CURRENT_DATE),
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_ATTENDANCE_STATUS]),
  ).withDefault([]),
};

const dashboardSearchParams = {
  ...commonParams,
  interval: parseAsStringEnum(INTERVAL_VALUES).withDefault(Interval.THIS_YEAR),
};

const emailSearchParams = {
  ...commonParams,
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_EMAIL_STATUS]),
  ).withDefault([]),
};

const trainingSearchParams = {
  ...commonParams,
  interval: parseAsStringEnum(INTERVAL_VALUES).withDefault(Interval.THIS_MONTH),
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_SESSION_STATUS]),
  ).withDefault([]),
};

/* ================== 👯‍♂️ Client-Side Hooks 👯‍♂️ ================== */

/**
 * @description Read default values straight off the hook
 * (e.g. `useMatchFilters.defaults`) without importing the raw params.
 */
function createFilters<T extends UseQueryStatesKeysMap>(
  params: T,
  options: Options = {},
) {
  const useFilters = () => useQueryStates(params, options);
  useFilters.defaults = getDefaults(params);

  return Object.assign(() => useQueryStates(params, options), {
    defaults: getDefaults(params),
  });
}

export const useCommonParams = (options: Options = {}) =>
  useQueryStates(commonParams, options);

export const useRosterFilters = createFilters(rosterSearchParams);
export const useAssetFilters = createFilters(assetSearchParams);
export const useTestTypeFilters = createFilters(testTypeSearchParams);
// Client-only by default (search/pagination/column filters never hit the
// server). Only the date change opts into `{ shallow: false }` at the call
// site, since it's the single param that drives the server `getTestResult`.
export const usePeriodicTestingFilters = createFilters(
  periodicTestingSearchParams,
);
export const useLeagueFilters = createFilters(leagueSearchParams);
export const useMatchFilters = createFilters(matchSearchParams);
export const useAttendanceFilters = createFilters(attendanceSearchParams, {
  shallow: false,
});
export const useTrainingFilters = createFilters(trainingSearchParams, {
  shallow: false,
});
export const useDashboardFilters = createFilters(dashboardSearchParams, {
  shallow: false,
});
export const useEmailFilters = createFilters(emailSearchParams);

/* ================== 🌩️ Server-Side Loaders 🌩️ ================== */

export const loadPeriodicTestingFilters = createLoader(
  periodicTestingSearchParams,
);
export const loadMatchFilters = createLoader(matchSearchParams);
export const loadAttendanceFilters = createLoader(attendanceSearchParams);
export const loadDashboardFilters = createLoader(dashboardSearchParams);
export const loadTrainingFilters = createLoader(trainingSearchParams);

/* ================== 🧮 Types & Enums 🧮 ================== */

export type MatchSearchParams = Awaited<ReturnType<typeof loadMatchFilters>>;
export type MatchSearchParamsKeys = keyof typeof matchSearchParams;
export type TrainingSearchParams = Awaited<
  ReturnType<typeof loadTrainingFilters>
>;
export type TrainingSearchParamsKeys = keyof typeof trainingSearchParams;
export type AttendanceSearchParams = Awaited<
  ReturnType<typeof loadAttendanceFilters>
>;

export function getDefaults<T extends UseQueryStatesKeysMap>(
  params: T,
): inferParserType<T> {
  return Object.fromEntries(
    Object.entries(params).map(([key, parser]) => [key, parser.defaultValue]),
  ) as inferParserType<T>;
}
