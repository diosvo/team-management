import { revalidatePath, revalidateTag } from 'next/cache';

export const getCacheTag = {
  user: (userId: string) => `user:${userId}` as const,
  rule: () => 'team-rule' as const,
} as const;

// Revalidation functions
export const revalidate = {
  assets: () => revalidatePath('/assets'),
  testTypes: () => revalidatePath('/periodic-testing/test-types'),
  roster: () => revalidatePath('/roster'),
  rule: () => {
    revalidatePath('/team-rule');
    revalidateTag(getCacheTag.rule(), 'max');
  },
  user: (userId: string) => {
    revalidatePath(`/profile/${userId}`);
    revalidateTag(getCacheTag.user(userId), 'max');
  },
} as const;
