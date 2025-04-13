import { cache } from 'react';

import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

import { hashPassword } from './password-reset-token';

export const getUsers = cache(async () => {
  try {
    return await db.select().from(UserTable);
  } catch {
    logger.warn('An error when fetching users');
    return [];
  }
});

export async function getUserByEmail(email: string) {
  try {
    return await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    });
  } catch {
    return null;
  }
}

export async function getUserById(user_id: string) {
  try {
    return await db.query.UserTable.findFirst({
      where: eq(UserTable.user_id, user_id),
    });
  } catch {
    logger.error('Failed to fetch user');
    return null;
  }
}

export async function insertUser(values: User) {
  try {
    const hashedPassword = await hashPassword(values.password as string);

    return await db.insert(UserTable).values({
      ...values,
      password: hashedPassword,
    });
  } catch {
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
