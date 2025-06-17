import { revalidatePath, revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/data-cache';

export function revalidateRosterPath() {
  return revalidatePath('/roster');
}

/**
 * @description Used for storing and retrieving the cached data
 */
export function userCacheKey() {
  return getGlobalTag('user');
}

/**
 * @description Used for invalidating the cache with `revalidateTag()`
 */
export function userCacheTag(user_id: string) {
  return getIdTag('user', user_id);
}

export function revalidateUserTag(user_id: string) {
  return revalidateTag(userCacheTag(user_id));
}
