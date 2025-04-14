import { revalidatePath } from 'next/cache';

export function revalidateAdminPath() {
  revalidatePath('/admin');
}
