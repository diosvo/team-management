import { ColorPalette } from '@chakra-ui/react';
import {
  Award,
  Crown,
  Flag,
  Flame,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react';

import { AchievementType } from '@/utils/enum';

type AchievementStyle = {
  label: string;
  colorPalette: ColorPalette;
  icon: typeof Trophy;
};

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
  },
  [AchievementType.MVP]: {
    label: 'MVP',
    colorPalette: 'purple',
    icon: Crown,
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
  },
};

export const PODIUM_TYPES = [
  AchievementType.CHAMPION,
  AchievementType.RUNNER_UP,
  AchievementType.THIRD_PLACE,
] as const;

export const FOUNDING_STYLE: AchievementStyle = {
  label: 'Team Founded',
  colorPalette: 'green',
  icon: Flag,
};

/**
 * The club's story told year by year, from the first season onwards. Years
 * beyond the written arc reuse the captions after "Where It All Began".
 */
const YEAR_TAGLINES = [
  'Where It All Began.',
  'First Steps, Big Dreams.',
  'Rising Higher.',
  'The Foundation.',
  'Building Momentum.',
  'Relentless Growth.',
  'Stronger Together.',
];

/** @param index how far the year sits from the club's first season */
export function getYearTagline(index: number): string {
  if (index <= 0) return YEAR_TAGLINES[0];

  const [, ...rest] = YEAR_TAGLINES;
  return rest[(index - 1) % rest.length];
}
