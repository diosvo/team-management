import { AssetCategory, AssetCondition } from '../enum';
import type { Selection } from '../type';
import { ALL } from './app';

export const SELECTABLE_ASSET_CATEGORIES = [
  AssetCategory.EQUIPMENT,
  AssetCategory.TRAINING,
  AssetCategory.OTHERS,
] as const;
export const ASSET_CATEGORY_SELECTION: Selection<string> = [
  {
    label: 'Equipment',
    value: AssetCategory.EQUIPMENT,
    description: 'Balls, Backboards, etc',
  },
  {
    label: 'Training',
    value: AssetCategory.TRAINING,
    description: 'Cones, Hurdles, Jump ropes, etc',
  },
  {
    label: 'Others',
    value: AssetCategory.OTHERS,
    description: 'Uniforms, Jerseys, etc',
  },
];
export const ASSET_CATEGORY_VALUES = [
  ALL.value,
  ...SELECTABLE_ASSET_CATEGORIES,
];

export const SELECTABLE_ASSET_CONDITIONS = [
  AssetCondition.POOR,
  AssetCondition.FAIR,
  AssetCondition.GOOD,
  AssetCondition.OBSOLETE,
] as const;
export const ASSET_CONDITION_SELECTION: Selection<string> = [
  {
    label: 'Poor',
    value: AssetCondition.POOR,
    description: 'Broken, Damaged',
  },
  {
    label: 'Fair',
    value: AssetCondition.FAIR,
    description: 'Usable, Slightly Worn',
  },
  {
    label: 'Good',
    value: AssetCondition.GOOD,
    description: 'New, Excellent Condition',
  },
  {
    label: 'Obsolete',
    value: AssetCondition.OBSOLETE,
    description: 'No longer used',
  },
];
export const ASSET_CONDITION_VALUES = [
  ALL.value,
  ...SELECTABLE_ASSET_CONDITIONS,
];
