import { cacheTag } from 'next/cache';

import { and, eq, ne } from 'drizzle-orm';

import db from '@/drizzle';
import { User, UserRelations, UserTable } from '@/drizzle/schema/user';

import logger from '@/lib/logger';
import { UserRole, UserState } from '@/utils/enum';
import { hasPermissions } from '@/utils/helper';

import { getCacheTag } from '@/actions/cache';

export async function getUsers(team_id: string): Promise<Array<User>> {
  try {
    const users = await db.query.UserTable.findMany({
      where: and(
        eq(UserTable.team_id, team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN)
      ),
      with: {
        asPlayer: true,
        asCoach: true,
      },
    });

    return users.map(enrichUser);
  } catch (error) {
    logger.error('An error when fetching users', error);
    return [];
  }
}

export async function fetchActivePlayers(team_id: string) {
  'use cache';
  cacheTag(getCacheTag.active_players());

  try {
    const players = await db.query.UserTable.findMany({
      where: and(
        eq(UserTable.team_id, team_id),
        eq(UserTable.role, UserRole.PLAYER),
        eq(UserTable.state, UserState.ACTIVE)
      ),
      with: {
        asPlayer: true,
        asCoach: true,
      },
    });

    return players.map(enrichUser);
  } catch (error) {
    logger.error('An error when fetching active players', error);
    return [];
  }
}

export async function getUserById(id: string) {
  'use cache';
  cacheTag(getCacheTag.user(id));

  try {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, id),
      with: {
        asCoach: true,
        asPlayer: true,
      },
    });

    if (!user) return null;

    return enrichUser(user);
  } catch (error) {
    logger.error('Failed to fetch user:', error);
    return null;
  }
}

export async function updateUser(user_id: string, user: Partial<User>) {
  try {
    return await db
      .update(UserTable)
      .set(user)
      .where(eq(UserTable.id, user_id));
  } catch (error) {
    throw error;
  }
}

export async function deleteUser(user_id: string) {
  try {
    return await db.delete(UserTable).where(eq(UserTable.id, user_id));
  } catch {
    logger.error('Failed to delete user');
    return null;
  }
}

function enrichUser(user: UserRelations): User {
  const { asPlayer, asCoach, ...userData } = user;
  const { isPlayer, isCoach } = hasPermissions(userData.role);

  const getDetails = () => {
    if (isPlayer) return asPlayer;
    if (isCoach) return { ...asCoach, jersey_number: undefined };
    return { id: userData.id, jersey_number: undefined };
  };

  return {
    ...userData,
    details: getDetails(),
  };
}
