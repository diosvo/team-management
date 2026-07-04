export {
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
  useTestTypeFilters,
  useTrainingFilters,
} from '@/lib/nuqs';

const sameValue = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const bSet = new Set(b);
    return a.every((value) => bSet.has(value));
  }
  return a === b;
};

/**
 * @description Counts how many filters differ from their defaults, ignoring `page`/`q`.
 * Array-aware and order-insensitive (URL-decoded arrays may arrive reordered).
 */
export const countActiveFilters = <T extends Record<string, unknown>>(
  values: T,
  defaults: T,
): number =>
  Object.keys(defaults).filter(
    (key) =>
      !['page', 'q'].includes(key) && !sameValue(values[key], defaults[key]),
  ).length;

export function paginateData<T>(
  data: Array<T>,
  page: number,
  pageSize: number = 5,
): Array<T> {
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, data.length);

  return data.slice(start, end);
}
