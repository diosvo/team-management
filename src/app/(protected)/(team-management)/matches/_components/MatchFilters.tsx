'use client';

import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import type { FilterDef } from '@/types/filters';

import { useMatchFilters } from '@/lib/nuqs';
import { useSelection } from '@/i18n/enums';
import {
  ESTABLISHED_DATE,
  GAME_TYPE_SELECTION,
  MATCH_STATUS_SELECTION,
  MATCH_TYPE_SELECTION,
} from '@/utils/constants';

export default function MatchFilters() {
  const t = useTranslations('matches.filters');
  const gameTypeOptions = useSelection(GAME_TYPE_SELECTION, 'gameType');
  const matchTypeOptions = useSelection(MATCH_TYPE_SELECTION, 'matchType');
  const statusOptions = useSelection(MATCH_STATUS_SELECTION, 'matchStatus');

  const FILTERS: Array<FilterDef> = [
    {
      key: 'range',
      label: t('time'),
      control: { type: 'date-range', min: ESTABLISHED_DATE },
    },
    {
      key: 'game_type',
      label: t('gameType'),
      control: { type: 'checkbox-group', options: gameTypeOptions },
    },
    {
      key: 'match_type',
      label: t('matchType'),
      control: { type: 'checkbox-group', options: matchTypeOptions },
    },
    {
      key: 'status',
      label: t('status'),
      control: { type: 'checkbox-group', options: statusOptions },
    },
  ];

  const [values, setSearchParams] = useMatchFilters();

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useMatchFilters.defaults}
      onApply={(next) =>
        setSearchParams({ ...next, page: 1 }, { shallow: false })
      }
    />
  );
}
