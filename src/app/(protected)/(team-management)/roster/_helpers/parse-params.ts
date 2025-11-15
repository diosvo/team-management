import { getDefaults } from '@/lib/zod';
import { SelectableRole, SelectableState } from '@/utils/type';

import { FilterUsersSchema, FilterUsersValues } from '@/schemas/user';

// Replace with nuqs
export function parseSearchParams(
  searchParams: Partial<{
    query: string;
    role: string;
    state: string;
  }>
): FilterUsersValues {
  const filters = FilterUsersSchema.safeParse({
    query: searchParams?.query || '',
    role: searchParams?.role
      ? (searchParams.role.split(',') as Array<SelectableRole>)
      : [],
    state: searchParams?.state
      ? (searchParams.state.split(',') as Array<SelectableState>)
      : [],
  });

  const defaultFilters = getDefaults(FilterUsersSchema);
  const initialFilters = filters.success ? filters.data : defaultFilters;

  return initialFilters;
}
