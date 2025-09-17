import { getGlobalTag } from '@/lib/data-cache';

/**
 * @description Used for selective revalidation
 */
export function teamCacheTag() {
  return getGlobalTag('team');
}

/**
 * @description Used for cache invalidation
 */
export function teamCacheKey() {
  return 'default-team';
}
