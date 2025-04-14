import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { PasswordTokenTable } from '@/drizzle/schema';

export function hashPassword(password: string) {
  return hash(password, 10);
}

export async function insertPasswordResetToken(
  email: string,
  token: string,
  expires_at: Date
) {
  const [resetToken] = await db
    .insert(PasswordTokenTable)
    .values({
      email,
      token,
      expires_at,
    })
    .returning();

  return resetToken;
}

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    return await db.query.PasswordTokenTable.findFirst({
      where: eq(PasswordTokenTable.token, token),
    });
  } catch {
    return null;
  }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    return await db.query.PasswordTokenTable.findFirst({
      where: eq(PasswordTokenTable.email, email),
    });
  } catch {
    return null;
  }
};

export async function deletePasswordResetTokenByEmail(email: string) {
  try {
    return await db
      .delete(PasswordTokenTable)
      .where(eq(PasswordTokenTable.email, email));
  } catch {
    return null;
  }
}
