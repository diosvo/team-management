import type { ReactNode } from 'react';

import type { DateBounds } from '@/types/common';
import type { DateSelection } from '@/utils/datetime';
import { Option } from '@/utils/type';

export type FilterControl =
  // Renders inline and reads/writes the `from`/`to` params
  // `single` commits `from === to`.
  | ({
      type: 'date-range';
      selection?: DateSelection;
      icon?: ReactNode; // replaces the trigger's calendar icon
    } & DateBounds)
  | { type: 'checkbox-group'; options: Array<Option> }; // panel / drawer, multi-select

export type FilterDef = {
  key: string;
  label: string;
  control: FilterControl;
};
