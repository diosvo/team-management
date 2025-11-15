import { useQueryStates } from 'nuqs';
import { type Options, parseAsStringEnum } from 'nuqs/server';

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

export const useAssetFilters = (options: Options = {}) =>
  useQueryStates(searchParams, options);
