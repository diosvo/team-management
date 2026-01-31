import { cacheTag } from 'next/cache';

import { and, eq, ne } from 'drizzle-orm';

import db from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema/user';

import logger from '@/lib/logger';
import { UserRole, UserState } from '@/utils/enum';

import { getCacheTag } from '@/actions/cache';

export async function getUsers(team_id: string): Promise<Array<User>> {
  try {
    const users = await db.query.UserTable.findMany({
      where: and(
        eq(UserTable.team_id, team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      with: {
        player: true,
        coach: true,
      },
    });

    return users;
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
        eq(UserTable.state, UserState.ACTIVE),
      ),
      with: {
        player: true,
      },
    });

    return players;
  } catch (error) {
    logger.error('An error when fetching active players', error);
    return [];
  }
}

export async function getUserById(id: string): Promise<Nullish<User>> {
  try {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, id),
      with: {
        coach: true,
        player: true,
      },
    });

    return user;
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
  } catch (error) {
    throw error;
  }
}
