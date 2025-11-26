import { useQueryStates } from 'nuqs';
import { parseAsStringEnum } from 'nuqs/server';

import {
  ALL,
  AssetCategoryValues,
  AssetConditionValues,
} from '@/utils/constant';
import { commonParams } from '@/utils/filters';

const searchParams = {
  ...commonParams,
  category: parseAsStringEnum(AssetCategoryValues).withDefault(ALL.value),
  condition: parseAsStringEnum(AssetConditionValues).withDefault(ALL.value),
};

export const useAssetFilters = () => useQueryStates(searchParams);
