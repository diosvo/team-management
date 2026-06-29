'use client';

import Filters from '@/components/filters/Filters';

import usePermissions from '@/hooks/use-permissions';

import { useRosterFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { USER_ROLE_SELECTION, USER_STATE_SELECTION } from '@/utils/constant';

const STATE_FILTER: FilterDef = {
  key: 'state',
  label: 'State',
  control: { type: 'checkbox-group', options: USER_STATE_SELECTION },
};

const ROLE_FILTER: FilterDef = {
  key: 'role',
  label: 'Role',
  control: { type: 'checkbox-group', options: USER_ROLE_SELECTION },
};

export default function RosterFilters() {
  const { isAdmin, isCaptain } = usePermissions();
  const [values, setSearchParams] = useRosterFilters();

  const filters = [
    STATE_FILTER,
    ...(isAdmin || isCaptain ? [ROLE_FILTER] : []),
  ];

  return (
    <Filters
      filters={filters}
      values={values}
      defaults={useRosterFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
