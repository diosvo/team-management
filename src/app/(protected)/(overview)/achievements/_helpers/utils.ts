import { ColorPalette } from '@chakra-ui/react';
import { Award, Crown, Flame, Medal, Sparkles, Trophy } from 'lucide-react';

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
