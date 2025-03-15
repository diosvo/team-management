import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { UserTable } from '@/drizzle/schema';

import { RegisterValues } from '../schemas/auth';

export async function getUserByEmail(email: string) {
  try {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    });
    return user;
  } catch {
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, id),
    });
    return user;
  } catch {
    return null;
  }
}

export async function insertUser(values: RegisterValues) {
  const hashedPassword = await bcrypt.hash(values.password, 9);

  const [newUser] = await db
    .insert(UserTable)
    .values({
      ...values,
      password: hashedPassword,
    })
    .returning();

  return newUser;
}
