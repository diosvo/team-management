'use client';

import { ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Filters from '@/components/filters/Filters';

import { useSelection } from '@/i18n/enums';
import { useAssetFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import {
  ASSET_CATEGORY_SELECTION,
  ASSET_CONDITION_SELECTION,
  ESTABLISHED_DATE,
} from '@/utils/constants';

export default function AssetFilters() {
  const t = useTranslations('assets');
  const categoryOptions = useSelection(
    ASSET_CATEGORY_SELECTION,
    'assetCategory',
  );
  const conditionOptions = useSelection(
    ASSET_CONDITION_SELECTION,
    'assetCondition',
  );

  const filters: Array<FilterDef> = [
    {
      key: 'acquired_date',
      label: t('table.acquiredDate'),
      control: {
        type: 'date-range',
        min: ESTABLISHED_DATE,
        icon: (
          <>
            <ShoppingCart size={12} />
            &nbsp;{t('table.acquiredDate')}:&nbsp;
          </>
        ),
      },
    },
    {
      key: 'category',
      label: t('category'),
      control: { type: 'checkbox-group', options: categoryOptions },
    },
    {
      key: 'condition',
      label: t('condition'),
      control: { type: 'checkbox-group', options: conditionOptions },
    },
  ];
  const [values, setSearchParams] = useAssetFilters();

  return (
    <Filters
      filters={filters}
      values={values}
      defaults={useAssetFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
