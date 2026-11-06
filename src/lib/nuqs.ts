import { useQueryStates, type UseQueryStatesKeysMap } from 'nuqs';
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  type inferParserType,
  type LoaderInput,
  type Options,
  type ParserMap,
} from 'nuqs/server';

import type { DateRange } from '@/types/common';
import {
  PERFORMANCE_TABS,
  SELECTABLE_ASSET_CATEGORIES,
  SELECTABLE_ASSET_CONDITIONS,
  SELECTABLE_ATTENDANCE_STATUS,
  SELECTABLE_EMAIL_STATUS,
  SELECTABLE_GAME_TYPES,
  SELECTABLE_LEAGUE_STATUS,
  SELECTABLE_MATCH_STATUS,
  SELECTABLE_MATCH_TYPES,
  SELECTABLE_PERFORMANCE_BANDS,
  SELECTABLE_PROGRESS_STATUS,
  SELECTABLE_SESSION_STATUS,
  SELECTABLE_TEST_TYPES,
  SELECTABLE_USER_ROLES,
  SELECTABLE_USER_STATES,
} from '@/utils/constants';
import { thisDay, thisYear } from '@/utils/datetime';
import { ActivityKind, enumValues } from '@/utils/enum';

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
  // Optional acquired-date window. Empty means all time.
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
};

const periodicTestingSearchParams = {
  ...commonParams,
  date: parseAsString.withDefault(''),
  // Test type names to display as columns (empty = show all). Dynamic per date,
  // so parsed as free-form strings rather than a fixed enum.
  type: parseAsArrayOf(parseAsString).withDefault([]),
};

const progressionSearchParams = {
  ...commonParams,
  // Selected test type id; empty falls back to the first type with results.
  type: parseAsString.withDefault(''),
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_PROGRESS_STATUS]),
  ).withDefault([]),
  band: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_PERFORMANCE_BANDS]),
  ).withDefault([]),
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

/**
 * Shared inclusive ISO-day window for range-filtered pages. No parser default:
 * the window is filled per read so a long-lived process does not keep serving
 * the startup day.
 */
const dateRangeParams = { from: parseAsString, to: parseAsString };

// A type literal, not `DateRange`: an interface would drop the index
// signature that `Filters` reads the values through.
type WithWindow<V> = Omit<V, 'from' | 'to'> & { from: string; to: string };

/**
 * Shared fallback window for range-filtered pages; keep client and loader in sync.
 */
type RangeFilters<T> = {
  params: T & typeof dateRangeParams;
  window: () => DateRange;
};

const withWindow = <V extends object>(
  values: V,
  window: () => DateRange,
): WithWindow<V> => {
  const { from, to } = values as Partial<Record<'from' | 'to', string | null>>;
  const fallback = window();
  return {
    ...values,
    from: from ?? fallback.from,
    to: to ?? fallback.to,
  } as WithWindow<V>;
};

export const matchSearchParams = {
  ...commonParams,
  ...dateRangeParams,
  game_type: parseAsArrayOf(
    parseAsStringEnum(SELECTABLE_GAME_TYPES),
  ).withDefault([]),
  match_type: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_MATCH_TYPES]),
  ).withDefault([]),
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_MATCH_STATUS]),
  ).withDefault([]),
};
const matchFilters = { params: matchSearchParams, window: thisYear };

const attendanceSearchParams = {
  ...commonParams,
  ...dateRangeParams,
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_ATTENDANCE_STATUS]),
  ).withDefault([]),
};
const attendanceFilters = { params: attendanceSearchParams, window: thisDay };

const dashboardSearchParams = {
  ...commonParams,
  ...dateRangeParams,
};
const dashboardFilters = { params: dashboardSearchParams, window: thisYear };

const performanceSearchParams = {
  ...commonParams,
  ...dateRangeParams,
  tab: parseAsStringEnum([...PERFORMANCE_TABS]).withDefault('attendance'),
  // Test type name whose progress is charted (empty = first available).
  test: parseAsString.withDefault(''),
  kind: parseAsArrayOf(parseAsStringEnum(enumValues(ActivityKind))).withDefault(
    [],
  ),
};
const performanceFilters = {
  params: performanceSearchParams,
  window: thisYear,
};

const emailSearchParams = {
  ...commonParams,
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_EMAIL_STATUS]),
  ).withDefault([]),
};

const trainingSearchParams = {
  ...commonParams,
  ...dateRangeParams,
  status: parseAsArrayOf(
    parseAsStringEnum([...SELECTABLE_SESSION_STATUS]),
  ).withDefault([]),
};
const trainingFilters = { params: trainingSearchParams, window: thisYear };

/* ================== 👯‍♂️ Client-Side Hooks 👯‍♂️ ================== */

/**
 * @description Read default values straight off the hook
 * (e.g. `useMatchFilters.defaults`) without importing the raw params.
 */
function createFilters<T extends UseQueryStatesKeysMap>(
  params: T,
  options: Options = {},
) {
  return Object.assign(() => useQueryStates(params, options), {
    defaults: getDefaults(params),
  });
}

/** {@link createFilters} for a page whose `from`/`to` default to `window()`. */
function createRangeFilters<T extends UseQueryStatesKeysMap>(
  { params, window }: RangeFilters<T>,
  options: Options = {},
) {
  const useFilters = () => {
    const [values, setValues] = useQueryStates(params, options);
    return [withWindow(values, window), setValues] as const;
  };
  // `defineProperty`, not `Object.assign`: assign would read the getter once
  // and freeze the window it was meant to keep fresh.
  return Object.defineProperty(useFilters, 'defaults', {
    get: () => withWindow(getDefaults(params), window),
  }) as typeof useFilters & {
    readonly defaults: WithWindow<inferParserType<T>>;
  };
}

/** `createLoader` for a page whose `from`/`to` default to `window()`. */
function createRangeLoader<T extends ParserMap>({
  params,
  window,
}: RangeFilters<T>) {
  const load = createLoader(params);
  return async (input: LoaderInput | Promise<LoaderInput>) =>
    withWindow(load(await input), window);
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
// Only the type change hits the server (`{ shallow: false }` at the call site).
export const useProgressionFilters = createFilters(progressionSearchParams);
export const useLeagueFilters = createFilters(leagueSearchParams);
export const useMatchFilters = createRangeFilters(matchFilters);
export const useAttendanceFilters = createRangeFilters(attendanceFilters, {
  shallow: false,
});
export const useTrainingFilters = createRangeFilters(trainingFilters, {
  shallow: false,
});
export const useDashboardFilters = createRangeFilters(dashboardFilters, {
  shallow: false,
});
export const useEmailFilters = createFilters(emailSearchParams);
// Client-only by default: chart selection and activity filter never hit the
// server. The date range and the tab (only the open tab is fetched) opt into
// `{ shallow: false }` at their call sites.
export const usePerformanceFilters = createRangeFilters(performanceFilters);

/* ================== 🌩️ Server-Side Loaders 🌩️ ================== */

export const loadPeriodicTestingFilters = createLoader(
  periodicTestingSearchParams,
);
export const loadProgressionFilters = createLoader(progressionSearchParams);
export const loadMatchFilters = createRangeLoader(matchFilters);
export const loadAttendanceFilters = createRangeLoader(attendanceFilters);
export const loadDashboardFilters = createRangeLoader(dashboardFilters);
export const loadTrainingFilters = createRangeLoader(trainingFilters);
export const loadPerformanceFilters = createRangeLoader(performanceFilters);

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
