import { pick } from 'es-toolkit';

import { AchievementType } from '@/utils/enum';

import type { AchievementWithRelations } from '@/db/achievement';
import type {
  Achievement,
  InsertAchievement,
} from '@/drizzle/schema/achievement';

import { MOCK_LEAGUE } from './league';
import { MOCK_PLAYER, MOCK_USER } from './user';

export const MOCK_ACHIEVEMENT_INPUT: InsertAchievement = {
  team_id: 'team-123',
  type: AchievementType.CHAMPION,
  title: 'Champion',
  year: 2024,
  league_id: 'league-123',
  player_id: null,
  description: 'Won the summer league',
};

export const MOCK_ACHIEVEMENT: Achievement = {
  achievement_id: 'achievement-123',
  team_id: MOCK_ACHIEVEMENT_INPUT.team_id,
  type: AchievementType.CHAMPION,
  title: MOCK_ACHIEVEMENT_INPUT.title,
  year: MOCK_ACHIEVEMENT_INPUT.year,
  league_id: MOCK_ACHIEVEMENT_INPUT.league_id as string,
  player_id: null,
  description: MOCK_ACHIEVEMENT_INPUT.description as string,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

/** Dialog values for a standalone team honor (no league or player). */
export const MOCK_ACHIEVEMENT_FORM = {
  achievement_id: '',
  type: AchievementType.CHAMPION,
  title: MOCK_ACHIEVEMENT.title,
  year: MOCK_ACHIEVEMENT.year,
  league_id: null,
  player_id: null,
  description: '',
};

/** Top-scorer suggestions for a league, as `getPlayerLeagueStatSuggestions` returns them. */
export const MOCK_STAT_SUGGESTIONS = [
  {
    player_id: MOCK_PLAYER.id,
    player_name: MOCK_USER.name,
    games_played: 10,
    avg_points: 24.5,
  },
];

/** `MOCK_ACHIEVEMENT` as `getAchievements` returns it, with its league joined. */
export const MOCK_ACHIEVEMENT_WITH_RELATIONS: AchievementWithRelations = {
  ...MOCK_ACHIEVEMENT,
  league: pick(MOCK_LEAGUE, ['name', 'start_date', 'end_date']),
  player: null,
};

/** The `player` relation of an individual honor awarded to `MOCK_USER`. */
export const MOCK_ACHIEVEMENT_PLAYER: AchievementWithRelations['player'] = {
  id: MOCK_PLAYER.id,
  user: pick(MOCK_USER, ['id', 'name', 'image']),
};
