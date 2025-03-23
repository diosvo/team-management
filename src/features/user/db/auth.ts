import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { UserTable } from '@/drizzle/schema';

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

export async function insertUser(values: RegisterValues) {
  try {
    const hashedPassword = await hash(values.password, 9);

    return await db.insert(UserTable).values({
      ...values,
      password: hashedPassword,
    });
  } catch {
    return null;
  }
}
