import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { AccountTable, User, UserTable } from '@/drizzle/schema';

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
    return null;
  }
}

export async function getAccountById(user_id: string) {
  try {
    return await db.query.AccountTable.findFirst({
      where: eq(AccountTable.userId, user_id),
    });
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  return hash(password, 9);
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
