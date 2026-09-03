import { asc, avg, count, desc, eq, sql } from 'drizzle-orm';

import db from '@/drizzle';
import {
  AchievementTable,
  type InsertAchievement,
} from '@/drizzle/schema/achievement';
import { MatchPlayerStatsTable, MatchTable } from '@/drizzle/schema/match';
import { UserTable } from '@/drizzle/schema/user';
import type { UpsertAchievementSchemaValues } from '@/schemas/achievement';

export async function getAchievements() {
  try {
    return await db.query.AchievementTable.findMany({
      orderBy: [
        desc(AchievementTable.year),
        asc(AchievementTable.type),
        desc(AchievementTable.created_at),
      ],
      with: {
        league: {
          columns: { name: true, start_date: true, end_date: true },
        },
        player: {
          columns: { id: true },
          with: {
            user: { columns: { id: true, name: true, image: true } },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export type AchievementWithRelations = Awaited<
  ReturnType<typeof getAchievements>
>[number];

export async function insertAchievement(achievement: InsertAchievement) {
  return await db.insert(AchievementTable).values(achievement).returning({
    achievement_id: AchievementTable.achievement_id,
  });
}

export async function updateAchievement(
  achievement_id: string,
  achievement: UpsertAchievementSchemaValues,
) {
  return await db
    .update(AchievementTable)
    .set(achievement)
    .where(eq(AchievementTable.achievement_id, achievement_id));
}

export async function deleteAchievement(achievement_id: string) {
  return await db
    .delete(AchievementTable)
    .where(eq(AchievementTable.achievement_id, achievement_id));
}

/**
 * Top-performing players in a league, used to suggest MVP / Top Scorer
 * candidates when recording an individual honor.
 */
export async function getPlayerLeagueStatSuggestions(league_id: string) {
  try {
    const avgPointsSql = sql<number>`ROUND(${avg(MatchPlayerStatsTable.points_scored)}, 1)`;

    return await db
      .select({
        player_id: MatchPlayerStatsTable.player_id,
        player_name: UserTable.name,
        games_played: count(MatchPlayerStatsTable.match_id),
        avg_points: avgPointsSql,
      })
      .from(MatchPlayerStatsTable)
      .innerJoin(
        MatchTable,
        eq(MatchPlayerStatsTable.match_id, MatchTable.match_id),
      )
      .innerJoin(UserTable, eq(MatchPlayerStatsTable.player_id, UserTable.id))
      .where(eq(MatchTable.league_id, league_id))
      .groupBy(MatchPlayerStatsTable.player_id, UserTable.name)
      .orderBy(desc(avgPointsSql))
      .limit(5);
  } catch {
    return [];
  }
}
