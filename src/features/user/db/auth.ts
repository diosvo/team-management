import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

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
      where: eq(UserTable.id, user_id),
    });
  } catch {
    logger.error('Failed to fetch user');
    return null;
  }
}

export function hashPassword(password: string) {
  return hash(password, 10);
}

export async function updateUser(user: User) {
  try {
    return await db
      .update(UserTable)
      .set(user)
      .where(eq(UserTable.id, user.id));
  } catch {
    return null;
  }
}
