import { revalidatePath } from 'next/cache';

export function revalidateTestTypesPath() {
  return revalidatePath('/periodic-testing/test-types');
}
