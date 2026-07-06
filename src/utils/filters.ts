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
 *
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

type FieldAccessor<T> = keyof T | ((item: T) => unknown);

const read = <T>(item: T, field: FieldAccessor<T>): unknown =>
  typeof field === 'function' ? field(item) : item[field];

interface PredicateConfig<T> {
  /**
   * Case-insensitive text search. Passes when ANY field includes the query.
   * Use a key for direct props or an accessor for nested/derived values
   * (e.g. `(item) => item.location?.name`).
   */
  search?: { query: string; fields: Array<FieldAccessor<T>> };
  /**
   * Multi-select filters, AND-ed together. Each key maps a URL query value
   * (selected options) to the matching item property; an empty selection is
   * ignored, otherwise `item[key]` must be one of the selected values.
   */
  match?: Partial<Record<keyof T, ReadonlyArray<unknown>>>;
}

/**
 * @description Replacing the hand-written boolean chains in each table component.
 *
 * Behavior is inferred from the config shape: `search` does case-insensitive OR matching, while `match` does AND-ed `includes` checks keyed by item property.
 */
export function buildPredicate<T>({ search, match }: PredicateConfig<T>) {
  const query = search?.query.trim().toLowerCase() ?? '';
  const matchEntries = Object.entries(match ?? {}) as Array<
    [keyof T, ReadonlyArray<unknown>]
  >;

  return (item: T): boolean => {
    if (query) {
      const matched = search!.fields.some((field) => {
        const value = read(item, field);
        return typeof value === 'string' && value.toLowerCase().includes(query);
      });
      if (!matched) return false;
    }

    return matchEntries.every(
      ([key, selected]) =>
        selected.length === 0 || selected.includes(item[key]),
    );
  };
}

export function paginateData<T>(
  data: Array<T>,
  page: number,
  pageSize: number = 5,
): Array<T> {
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, data.length);

  return data.slice(start, end);
}
