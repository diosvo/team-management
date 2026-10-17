'use client';

import { ShoppingCart } from 'lucide-react';

import Filters from '@/components/filters/Filters';

import { useAssetFilters } from '@/lib/nuqs';
import type { FilterDef } from '@/types/filters';
import {
  ASSET_CATEGORY_SELECTION,
  ASSET_CONDITION_SELECTION,
  ESTABLISHED_DATE,
} from '@/utils/constants';

const FILTERS: Array<FilterDef> = [
  {
    key: 'acquired_date',
    label: 'Acquired Date',
    control: {
      type: 'date-range',
      min: ESTABLISHED_DATE,
      icon: (
        <>
          <ShoppingCart size={12} />
          &nbsp;Acquired Date:&nbsp;
        </>
      ),
    },
  },
  {
    key: 'category',
    label: 'Category',
    control: { type: 'checkbox-group', options: ASSET_CATEGORY_SELECTION },
  },
  {
    key: 'condition',
    label: 'Condition',
    control: { type: 'checkbox-group', options: ASSET_CONDITION_SELECTION },
  },
];

export default function AssetFilters() {
  const [values, setSearchParams] = useAssetFilters();

  return (
    <Filters
      filters={FILTERS}
      values={values}
      defaults={useAssetFilters.defaults}
      onApply={(next) => setSearchParams({ ...next, page: 1 })}
    />
  );
}
