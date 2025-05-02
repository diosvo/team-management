import { getDefaults } from '@/lib/zod';
import { SelectableRole, SelectableState } from '@/utils/type';

import {
  FilterUsersSchema,
  FilterUsersValues,
} from '@/features/user/schemas/user';

export function parseSearchParams(
  searchParams: Partial<{
    query: string;
    roles: string;
    state: string;
  }>
): FilterUsersValues {
  const filters = FilterUsersSchema.safeParse({
    query: searchParams?.query || '',
    roles: searchParams?.roles
      ? (searchParams.roles.split(',') as Array<SelectableRole>)
      : [],
    state: searchParams?.state
      ? (searchParams.state.split(',') as Array<SelectableState>)
      : [],
  });

  const defaultFilters = getDefaults(FilterUsersSchema) as FilterUsersValues;
  const initialFilters = filters.success ? filters.data : defaultFilters;

  return initialFilters;
}
