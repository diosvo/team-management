import { cache } from 'react';

import { and, eq, ne } from 'drizzle-orm';

import { db } from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema';
import logger from '@/lib/logger';
import { UserRole } from '@/utils/enum';

import { AddUserValues } from '../schemas/user';

export const getUsers = cache(async (query: string) => {
  try {
    if (query) {
      return await db
        .select()
        .from(UserTable)
        .where(
          and(
            ne(UserTable.roles, [UserRole.SUPER_ADMIN]),
            eq(UserTable.name, `${query}`)
          )
        );
    }
    return await db
      .select()
      .from(UserTable)
      .where(and(ne(UserTable.roles, [UserRole.SUPER_ADMIN])));
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
      with: {
        team: {
          columns: {},
          with: {
            rule: {
              columns: {
                content: true,
                updated_at: true,
              },
            },
          },
        },
      },
    });
  } catch {
    logger.error('Failed to fetch user');
    return null;
  }
});

export async function insertUser(user: AddUserValues & { team_id: string }) {
  try {
    return await db.insert(UserTable).values(user);
  } catch (error) {
    logger.error(error);
    return null;
  }
}

export async function updateUser(user_id: string, user: Partial<User>) {
  try {
    return await db
      .update(UserTable)
      .set(user)
      .where(eq(UserTable.user_id, user_id));
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
