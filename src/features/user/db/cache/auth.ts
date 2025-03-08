import { revalidatePath, revalidateTag } from 'next/cache';

import { getGlobalTag } from '@/lib/data-cache';

export function getAuthGlobalTag() {
  return getGlobalTag('auth');
}

export function revalidateAuthCache() {
  revalidatePath('/dashboard');
  revalidateTag(getAuthGlobalTag());
}
