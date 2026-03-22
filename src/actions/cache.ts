import { revalidatePath, revalidateTag } from 'next/cache';

import { CACHE_TAG } from '@/utils/constant';

/**
 * @link https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 */
export const revalidate = {
  // Cached entities
  assets: () => {
    revalidatePath('/assets');
    revalidateTag(CACHE_TAG.ASSETS, 'max');
  },
  leagues: () => {
    revalidatePath('/leagues');
    revalidateTag(CACHE_TAG.LEAGUES, 'max');
  },
  locations: () => {
    revalidatePath('/locations');
    revalidateTag(CACHE_TAG.LOCATIONS, 'max');
  },
  rule: () => {
    revalidatePath('/team-rule');
    revalidateTag(CACHE_TAG.RULE, 'max');
  },
  // Non-cached entities (revalidatePath only)
  attendances: () => revalidatePath('/attendance'),
  matches: () => revalidatePath('/matches'),
  roster: () => revalidatePath('/roster'),
  sessions: () => revalidatePath('/training'),
  testResults: () => revalidatePath('/periodic-testing'),
  testTypes: () => revalidatePath('/periodic-testing/test-types'),
  user: (userId: string) => revalidatePath(`/profile/${userId}`),
} as const;
