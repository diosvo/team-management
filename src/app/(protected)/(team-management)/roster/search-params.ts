import { useQueryStates } from 'nuqs';
import { parseAsArrayOf, parseAsStringEnum } from 'nuqs/server';

import {
  SELECTABLE_USER_ROLES,
  SELECTABLE_USER_STATES,
} from '@/utils/constant';
import { commonParams } from '@/utils/filters';

const searchParams = {
  ...commonParams,
  role: parseAsArrayOf(parseAsStringEnum(SELECTABLE_USER_ROLES)).withDefault(
    []
  ),
  state: parseAsArrayOf(parseAsStringEnum(SELECTABLE_USER_STATES)).withDefault(
    []
  ),
};

export const useRosterFilters = () => useQueryStates(searchParams);
