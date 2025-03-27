import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { PasswordResetTokenTable } from '@/drizzle/schema';

export async function insertPasswordResetToken(
  email: string,
  token: string,
  expires_at: Date
) {
  const [resetToken] = await db
    .insert(PasswordResetTokenTable)
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
    return await db.query.PasswordResetTokenTable.findFirst({
      where: eq(PasswordResetTokenTable.token, token),
    });
  } catch {
    return null;
  }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    return await db.query.PasswordResetTokenTable.findFirst({
      where: eq(PasswordResetTokenTable.email, email),
    });
  } catch {
    return null;
  }
};

export async function deletePasswordResetTokenByEmail(email: string) {
  try {
    return await db
      .delete(PasswordResetTokenTable)
      .where(eq(PasswordResetTokenTable.email, email));
  } catch {
    return null;
  }
}
