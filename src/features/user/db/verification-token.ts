import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import {
  Token,
  User,
  UserTable,
  VerificationTokenTable,
} from '@/drizzle/schema';
import { ResponseFactory } from '@/utils/response';

export async function getVerificationTokenByToken(token: string) {
  try {
    return await db.query.VerificationTokenTable.findFirst({
      where: eq(VerificationTokenTable.token, token),
    });
  } catch {
    return null;
  }
}

export async function getVerificationTokenByEmail(email: string) {
  try {
    return await db.query.VerificationTokenTable.findFirst({
      where: eq(VerificationTokenTable.email, email),
    });
  } catch {
    return null;
  }
}

export async function deleteVerificationTokenByEmail(email: string) {
  try {
    return await db
      .delete(VerificationTokenTable)
      .where(eq(VerificationTokenTable.email, email));
  } catch {
    return null;
  }
}

export async function insertVerificationToken(
  email: string,
  token: string,
  expires_at: Date
) {
  const [verificationToken] = await db
    .insert(VerificationTokenTable)
    .values({
      email,
      token,
      expires_at,
    })
    .returning();

  return verificationToken;
}

export async function verifyUserEmail(user: User, token: Token) {
  try {
    await db
      .update(UserTable)
      .set({ emailVerified: new Date(), email: user.email })
      .where(eq(UserTable.id, user.id));

    await deleteVerificationTokenByEmail(token.email);
  } catch {
    return ResponseFactory.error('Failed to verify email!');
  }
}
