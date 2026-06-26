import { Option } from '@/utils/type';

export type FilterControl =
  | { type: 'interval' } // reuse TimePicker, always inline
  | { type: 'date'; min?: string; max?: string } // always inline
  | { type: 'checkbox-group'; options: Array<Option> }; // panel / drawer, multi-select

export type FilterDef = {
  key: string;
  label: string;
  control: FilterControl;
};
