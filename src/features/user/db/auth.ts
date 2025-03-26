import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { User, UserTable } from '@/drizzle/schema';

import { RegisterValues } from '../schemas/auth';

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
  try {
    return await db.query.UserTable.findFirst({
      where: eq(UserTable.id, id),
    });
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  return hash(password, 9);
}

export async function insertUser(values: RegisterValues) {
  try {
    const hashedPassword = await hashPassword(values.password);

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
      .where(eq(UserTable.id, user.id));
  } catch {
    return null;
  }
}
