'use client';

import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import { useSelection } from '@/i18n/enums';
import { useLeagueFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import { LEAGUE_STATUS_SELECTION } from '@/utils/constants';

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
