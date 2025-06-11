import { revalidatePath } from 'next/cache';

export function revalidateAssetsPath() {
  return revalidatePath('/assets');
}
