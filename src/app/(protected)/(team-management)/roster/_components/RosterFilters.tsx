'use client';

import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import usePermissions from '@/hooks/use-permissions';

import { useRosterFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { useSelection } from '@/i18n/enums';
import { USER_ROLE_SELECTION, USER_STATE_SELECTION } from '@/utils/constants';

export default function RosterFilters() {
  const { isAdmin, isCaptain } = usePermissions();
  const [values, setSearchParams] = useRosterFilters();
  const t = useTranslations('roster.filters');
  const stateOptions = useSelection(USER_STATE_SELECTION, 'userState');
  const roleOptions = useSelection(USER_ROLE_SELECTION, 'userRole');

  const STATE_FILTER: FilterDef = {
    key: 'state',
    label: t('state'),
    control: { type: 'checkbox-group', options: stateOptions },
  };

  const ROLE_FILTER: FilterDef = {
    key: 'role',
    label: t('role'),
    control: { type: 'checkbox-group', options: roleOptions },
  };

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
