import { AchievementType } from '../enum';
import type { Selection } from '../type';

export const SELECTABLE_ACHIEVEMENT_TYPES = [
  AchievementType.CHAMPION,
  AchievementType.RUNNER_UP,
  AchievementType.THIRD_PLACE,
  AchievementType.MVP,
  AchievementType.TOP_SCORER,
  AchievementType.CUSTOM,
] as const;
export const ACHIEVEMENT_TYPE_SELECTION: Selection<string> = [
  {
    label: 'Champion',
    value: AchievementType.CHAMPION,
  },
  {
    label: 'Runner-up',
    value: AchievementType.RUNNER_UP,
  },
  {
    label: '3rd Place',
    value: AchievementType.THIRD_PLACE,
    description: 'Third Place',
  },
  {
    label: 'MVP',
    value: AchievementType.MVP,
    description: 'Most Valuable Player',
  },
  {
    label: 'Top Scorer',
    value: AchievementType.TOP_SCORER,
  },
  {
    label: 'Custom',
    value: AchievementType.CUSTOM,
    description: 'Any other honor',
  },
];
/** Types awarded to a single player rather than the whole team */
export const INDIVIDUAL_ACHIEVEMENT_TYPES = [
  AchievementType.MVP,
  AchievementType.TOP_SCORER,
] as const;
