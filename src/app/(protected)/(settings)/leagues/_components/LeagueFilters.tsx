'use client';

import { useTranslations } from 'next-intl';

import { LEAGUE_STATUS_SELECTION } from '@/utils/constants';

import { useLeagueFilters } from '@/lib/nuqs';

import Filters from '@/components/filters/Filters';
import { useSelection } from '@/i18n/enums';
import type { FilterDef } from '@/types/filters';

export default function LeagueFilters() {
  const t = useTranslations('leagues');
  const statusOptions = useSelection(LEAGUE_STATUS_SELECTION, 'leagueStatus');

  const filters: Array<FilterDef> = [
    {
      key: 'status',
      label: t('status'),
      control: { type: 'checkbox-group', options: statusOptions },
    },
  ];
  const [values, setSearchParams] = useLeagueFilters();

  return (
    <Filters
      filters={filters}
      values={values}
      defaults={useLeagueFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
