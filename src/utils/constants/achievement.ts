import {
  Award,
  Crown,
  Flag,
  Flame,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react';

import type { AchievementStyle } from '@/types/achievements';

import { AchievementType } from '../enum';
import type { Selection } from '../type';

/** Gold / silver / bronze accents for placements, distinct hues for the rest */
export const ACHIEVEMENT_STYLE: Record<AchievementType, AchievementStyle> = {
  [AchievementType.CHAMPION]: {
    label: 'Champion',
    colorPalette: 'yellow',
    icon: Trophy,
  },
  [AchievementType.RUNNER_UP]: {
    label: 'Runner-up',
    colorPalette: 'gray',
    icon: Medal,
  },
  [AchievementType.THIRD_PLACE]: {
    label: '3rd Place',
    colorPalette: 'orange',
    icon: Award,
    description: 'Third Place',
  },
  [AchievementType.MVP]: {
    label: 'MVP',
    colorPalette: 'purple',
    icon: Crown,
    description: 'Most Valuable Player',
  },
  [AchievementType.TOP_SCORER]: {
    label: 'Top Scorer',
    colorPalette: 'teal',
    icon: Flame,
  },
  [AchievementType.CUSTOM]: {
    label: 'Custom',
    colorPalette: 'red',
    icon: Sparkles,
    description: 'Any other honor',
  },
} as const;

export const FOUNDING_STYLE: AchievementStyle = {
  label: 'Team Founded',
  colorPalette: 'green',
  icon: Flag,
};

export const ACHIEVEMENT_TYPE_SELECTION: Selection<string> = Object.entries(
  ACHIEVEMENT_STYLE,
).map(([value, { label, description }]) => ({
  label,
  value,
  description,
}));

export const SELECTABLE_ACHIEVEMENT_TYPES = [
  AchievementType.CHAMPION,
  AchievementType.RUNNER_UP,
  AchievementType.THIRD_PLACE,
  AchievementType.MVP,
  AchievementType.TOP_SCORER,
  AchievementType.CUSTOM,
] as const;

/** Types awarded to a single player rather than the whole team */
export const INDIVIDUAL_ACHIEVEMENT_TYPES = [
  AchievementType.MVP,
  AchievementType.TOP_SCORER,
] as const;
