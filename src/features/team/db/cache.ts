import { getGlobalTag } from '@/lib/data-cache';

/**
 * @description Used for storing and retrieving the cached data
 */
export function teamCacheKey() {
  return getGlobalTag('team');
}

/**
 * @description Used for cache invalidation
 */
export function teamCacheTag() {
  return 'team-default';
}
