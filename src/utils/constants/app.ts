import type { Option } from '../type';

export const FOUNDING_YEAR = 2024;
export const ESTABLISHED_DATE = FOUNDING_YEAR + '-02-20';
export const DEFAULT_DOB = '2000-01-01';
export const CURRENT_DATE = new Date().toISOString().split('T')[0];

export const DEFAULT_DAY_FORMAT = 'EEEE';
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const LOCALE_DATE_FORMAT = 'dd/MM/yyyy';
export const DEFAULT_TIME_FORMAT = 'h:mm a';
export const LOCALE_TIME_FORMAT = 'HH:mm:ss';
export const LOCALE_DATETIME_FORMAT =
  LOCALE_DATE_FORMAT + ' ' + LOCALE_TIME_FORMAT;

export const COOKIE = {
  prefix: 'sgr',
  expires: 60 * 60, // 1 hour in seconds
  maxAge: 60 * 60,
};

/** Cache keys used with `useSWR` */
export const CACHE_KEY = {
  LEAGUES: 'leagues',
  LOCATIONS: 'locations',
  OPPONENTS: 'opponents',
  PLAYERS: 'players',
  PLAYERS_IN_LEAGUE: (league_id: string) => `players-in-league-${league_id}`,
} as const;

/**
 * Cache tags used in `db/` with `'use cache'` + `cacheTag()`
 * @link https://nextjs.org/docs/app/api-reference/directives/use-cache
 */
export const CACHE_TAG = {
  ASSETS: 'assets',
  LEAGUES: 'leagues',
  LOCATIONS: 'locations',
  RULE: 'team-rule',
} as const;

export const ALL: Option<string> = {
  label: 'All',
  value: 'all',
};
