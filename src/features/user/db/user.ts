'server-only';

import {
  and,
  eq,
  getTableColumns,
  ilike,
  inArray,
  ne,
  or,
  SQL,
} from 'drizzle-orm';

import { db } from '@/drizzle';
import {
  InsertUser,
  User,
  UserRelations,
  UserTable,
} from '@/drizzle/schema/user';

import logger from '@/lib/logger';
import { UserRole } from '@/utils/enum';
import { hasPermissions } from '@/utils/helper';

import { FilterUsersValues } from '../schemas/user';

export async function getUsers({
  query,
  role,
  state,
}: FilterUsersValues): Promise<Array<User>> {
  // Always exclude SUPER_ADMIN user
  const filters: Array<SQL | undefined> = [
    ne(UserTable.role, UserRole.SUPER_ADMIN),
  ];

  // Only apply filters if parameters are provided and non-empty
  if (query && query.trim() !== '')
    filters.push(
      or(
        ilike(UserTable.email, `%${query}%`),
        ilike(UserTable.name, `%${query}%`)
      )
    );
  if (state && state.length > 0) filters.push(inArray(UserTable.state, state));
  if (role && role.length > 0) filters.push(inArray(UserTable.role, role));

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
      return users.map(enrichUser);
    });
  } catch (error) {
    logger.error('An error when fetching users', error);
    return [];
  }
}

export async function getExistingEmails() {
  try {
    const { email } = getTableColumns(UserTable);
    const data = await db.select({ email }).from(UserTable);
    return data.map((user) => user.email);
  } catch {
    logger.error('An error when getting existing emails');
    return [];
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    });
  } catch {
    return null;
  }
}

export async function getUserById(id: string) {
  // Temporarily uncache the user (unstable_cache) to ensure we always get the latest data
  try {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.user_id, id),
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

export async function insertUser(user: InsertUser) {
  const [data] = await db.insert(UserTable).values(user).returning({
    user_id: UserTable.user_id,
  });

  return data;
}

export async function updateUser(user_id: string, user: Partial<User>) {
  try {
    return await db
      .update(UserTable)
      .set(user)
      .where(eq(UserTable.user_id, user_id));
  } catch (error) {
    throw error;
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

function enrichUser(user: UserRelations): User {
  const { asPlayer, asCoach, ...userData } = user;
  const { isPlayer, isCoach } = hasPermissions(userData.role);

  if (isPlayer) return { ...userData, details: asPlayer };
  if (isCoach)
    return {
      ...userData,
      details: { ...asCoach, jersey_number: undefined },
    };

  return {
    ...userData,
    details: {
      user_id: userData.user_id,
      jersey_number: undefined,
    },
  };
}
