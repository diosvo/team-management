import type { Route } from 'next';
import {
  createSerializer,
  type CreateSerializerOptions,
  Options,
  parseAsInteger,
  parseAsString,
  type ParserMap,
  useQueryStates,
} from 'nuqs';

export const commonParams = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
};

export const useCommonParams = (options: Options = {}) =>
  useQueryStates(commonParams, options);

/**
 * @description Creates a typed link generator for the specified route with given parsers.
 *
 * @example
 *
 * ```ts
 * const link = createTypedLink('/users', commonParams);
 * ```
 */
export function createTypedLink<Parsers extends ParserMap>(
  route: Route,
  parsers: Parsers,
  options: CreateSerializerOptions<Parsers> = {}
) {
  const serialize = createSerializer<Parsers, Route, Route>(parsers, options);
  return serialize.bind(null, route);
}

export function paginateData<T>(
  data: Array<T>,
  page: number,
  pageSize: number = 5
): Array<T> {
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, data.length);

  return data.slice(start, end);
}
