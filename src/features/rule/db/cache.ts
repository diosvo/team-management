import { revalidatePath } from 'next/cache';

import { getGlobalTag } from '@/lib/data-cache';

export function getRuleTag() {
  return getGlobalTag('rule');
}

export function revalidateRulePath() {
  return revalidatePath('/team-rule');
}
