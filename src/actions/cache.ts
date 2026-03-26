import { revalidatePath } from 'next/cache';

/**
 * @link https://nextjs.org/docs/app/api-reference/functions/revalidatePath
 */
export const revalidate = {
  // Cached entities (use cache tag + revalidatePath)
  leagues: () => {
    revalidatePath('/leagues');
    // revalidateTag(CACHE_TAG.LEAGUES, 'max');  // temp turn-off
  },
  locations: () => {
    revalidatePath('/locations');
    // revalidateTag(CACHE_TAG.LOCATIONS, 'max');
  },
  rule: () => {
    revalidatePath('/team-rule');
    // revalidateTag(CACHE_TAG.RULE, 'max');
  },
  // Non-cached entities (revalidatePath only)
  assets: () => revalidatePath('/assets'),
  attendances: () => revalidatePath('/attendance'),
  matches: () => revalidatePath('/matches'),
  roster: () => revalidatePath('/roster'),
  sessions: () => revalidatePath('/training'),
  testResults: () => revalidatePath('/periodic-testing'),
  testTypes: () => revalidatePath('/periodic-testing/test-types'),
  user: (userId: string) => revalidatePath(`/profile/${userId}`),
} as const;
