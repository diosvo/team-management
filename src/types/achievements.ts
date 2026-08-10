import { ColorPalette } from '@chakra-ui/react';
import { type LucideIcon } from 'lucide-react';

export type AchievementStyle = {
  label: string;
  colorPalette: ColorPalette;
  icon: LucideIcon;
  description?: string;
};
