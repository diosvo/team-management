import { revalidatePath, revalidateTag } from 'next/cache';

export const getCacheTag = {
  user: (userId: string) => `user:${userId}`,
  active_players: () => 'active-players',
  rule: () => 'team-rule',
  assets: () => 'assets',
  locations: () => 'locations',
  matches: () => 'matches',
  leagues: () => 'leagues',
  team: () => 'team',
  opponents: () => 'opponents',
} as const;

// Revalidation functions
// https://nextjs.org/docs/app/api-reference/functions/revalidateTag
export const revalidate = {
  assets: () => {
    revalidatePath('/assets');
    revalidateTag(getCacheTag.assets(), 'max');
  },
  locations: () => {
    revalidatePath('/locations');
    revalidateTag(getCacheTag.locations(), 'max');
  },
  matches: () => {
    revalidatePath('/matches');
    revalidateTag(getCacheTag.matches(), 'max');
  },
  leagues: () => {
    revalidatePath('/leagues');
    revalidateTag(getCacheTag.leagues(), 'max');
  },
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
  attendances: () => {
    revalidatePath('/attendance');
  },
} as const;
