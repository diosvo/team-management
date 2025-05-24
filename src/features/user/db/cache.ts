import { getIdTag } from '@/lib/data-cache';
import { revalidatePath, revalidateTag } from 'next/cache';

export function revalidateRosterPath() {
  return revalidatePath('/roster');
}

export function revalidateUserTag(user_id: string) {
  revalidateTag(getIdTag('user', user_id));
  revalidateRosterPath();
}
