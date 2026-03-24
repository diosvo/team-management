import { revalidatePath } from 'next/cache';

/**
 * @link https://nextjs.org/docs/app/api-reference/functions/revalidatePath
 */
export const revalidate = {
  // Cached entities (use cache tag + revalidatePath)
  rule: () => {
    revalidatePath('/team-rule');
    // revalidateTag(CACHE_TAG.RULE, 'max'); // temp turn-off
  },
  // Non-cached entities (revalidatePath only)
  assets: () => revalidatePath('/assets'),
  leagues: () => revalidatePath('/leagues'),
  locations: () => revalidatePath('/locations'),
  attendances: () => revalidatePath('/attendance'),
  matches: () => revalidatePath('/matches'),
  roster: () => revalidatePath('/roster'),
  sessions: () => revalidatePath('/training'),
  testResults: () => revalidatePath('/periodic-testing'),
  testTypes: () => revalidatePath('/periodic-testing/test-types'),
  user: (userId: string) => revalidatePath(`/profile/${userId}`),
} as const;
