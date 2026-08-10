import { Achievement, InsertAchievement } from '@/drizzle/schema/achievement';
import { AchievementType } from '@/utils/enum';

export const MOCK_ACHIEVEMENT_INPUT: InsertAchievement = {
  type: AchievementType.CHAMPION,
  title: 'Champion',
  year: 2024,
  league_id: 'league-123',
  player_id: null,
  description: 'Won the summer league',
};

export const MOCK_ACHIEVEMENT: Achievement = {
  achievement_id: 'achievement-123',
  type: AchievementType.CHAMPION,
  title: MOCK_ACHIEVEMENT_INPUT.title,
  year: MOCK_ACHIEVEMENT_INPUT.year,
  league_id: MOCK_ACHIEVEMENT_INPUT.league_id as string,
  player_id: null,
  description: MOCK_ACHIEVEMENT_INPUT.description as string,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};
