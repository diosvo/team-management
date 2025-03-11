import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { UserTable } from '@/db/schema';

import { RegisterValues } from '../schemas/auth';

async function findUserBy<T extends keyof typeof UserTable>(
  field: T,
  value: string
) {
  try {
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable[field] as any, value),
    });
    return user;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string) {
  return findUserBy('email', email);
}

export async function getUserById(id: string) {
  return findUserBy('id', id);
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
