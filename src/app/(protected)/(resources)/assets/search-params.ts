import { useQueryStates } from 'nuqs';
import { parseAsStringEnum } from 'nuqs/server';

import {
  ALL,
  ASSET_CATEGORY_VALUES,
  ASSET_CONDITION_VALUES,
} from '@/utils/constant';
import { commonParams } from '@/utils/filters';

const searchParams = {
  ...commonParams,
  category: parseAsStringEnum(ASSET_CATEGORY_VALUES).withDefault(ALL.value),
  condition: parseAsStringEnum(ASSET_CONDITION_VALUES).withDefault(ALL.value),
};

export const useAssetFilters = () => useQueryStates(searchParams);
