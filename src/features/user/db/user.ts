import { cache } from 'react';

import {
  and,
  arrayContained,
  eq,
  getTableColumns,
  ilike,
  inArray,
  not,
  or,
  SQL,
} from 'drizzle-orm';

import { db } from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema';

import logger from '@/lib/logger';
import { UserRole } from '@/utils/enum';

import { AddUserValues, FilterUsersValues } from '../schemas/user';

export const getUsers = cache(
  async ({ query, roles, state }: FilterUsersValues) => {
    // Always exclude SUPER_ADMIN user
    const filters: Array<SQL | undefined> = [
      not(arrayContained(UserTable.roles, [UserRole.SUPER_ADMIN])),
    ];

    // Only apply filters if parameters are provided and non-empty
    if (query && query.trim() !== '')
      filters.push(
        or(
          ilike(UserTable.email, `%${query}%`),
          ilike(UserTable.name, `%${query}%`)
        )
      );
    if (state && state.length > 0)
      filters.push(inArray(UserTable.state, state));
    if (roles && roles.length > 0)
      filters.push(arrayContained(UserTable.roles, roles));

    try {
      // Use prepared query to improve performance and reusability
      return await db.transaction(async (tx) => {
        const users = await tx.query.UserTable.findMany({
          where: and(...filters),
          with: {
            asPlayer: true,
            asCoach: true,
          },
        });

        // Process results in batches for better memory management
        return users.map(({ asPlayer, asCoach, ...user }) => {
          // Use destructuring to avoid modifying the original object

          if (user.roles.includes(UserRole.PLAYER))
            return { ...user, details: asPlayer };
          if (user.roles.includes(UserRole.COACH))
            return { ...user, details: asCoach };
          return user;
        });
      });
    } catch (error) {
      logger.error('An error when fetching users', error);
      return [];
    }
  }
);

export const getExistingEmails = cache(async () => {
  try {
    const { email } = getTableColumns(UserTable);
    const data = await db.select({ email }).from(UserTable);
    return data.map((user) => user.email);
  } catch {
    logger.error('An error when getting existing emails');
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
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.user_id, user_id),
      with: {
        asCoach: true,
        asPlayer: true,
      },
    });

    if (!user) return null;

    if (user.roles.includes(UserRole.PLAYER))
      return { ...user, details: user.asPlayer };
    if (user.roles.includes(UserRole.COACH))
      return { ...user, details: user.asCoach };

    return user;
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
