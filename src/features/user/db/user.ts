import { cache } from 'react';

import { eq, ne } from 'drizzle-orm';

import { db } from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

import { AddUserValues } from '../schemas/user';

export const getUsers = cache(async () => {
  try {
    return await db
      .select()
      .from(UserTable)
      .where(ne(UserTable.roles, ['SUPER_ADMIN']));
  } catch {
    logger.error('An error when fetching users');
    return [];
  }
});

export const getUserByEmail = cache(async (email: string) => {
  try {
    return await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    });
  } catch {
    return null;
  }
});

export const getUserById = cache(async (user_id: string) => {
  try {
    return await db.query.UserTable.findFirst({
      where: eq(UserTable.user_id, user_id),
    });
  } catch {
    logger.error('Failed to fetch user');
    return null;
  }
});

export async function insertUsers(
  users: Array<AddUserValues & { team_id: string }>
) {
  try {
    return await db.insert(UserTable).values(users);
  } catch {
    logger.error('Failed to insert user(s)');
    return null;
  }
}

export async function updateUser(user: User) {
  try {
    return await db
      .update(UserTable)
      .set(user)
      .where(eq(UserTable.user_id, user.user_id));
  } catch {
    return null;
  }
}

export async function deleteUser(user_id: string) {
  try {
    return await db.delete(UserTable).where(eq(UserTable.user_id, user_id));
  } catch {
    logger.error('Failed to delete user');
    return null;
  }
}
