import { eq } from 'drizzle-orm';
import { v4 as uuidV4 } from 'uuid';

import { db } from '@/drizzle';
import { UserTable, VerificationTokenTable } from '@/drizzle/schema';
import { ResponseFactory } from '@/utils/response';

export async function generateVerificationToken(email: string) {
  const token = uuidV4();
  const expires_at = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await deleteVerificationTokenByEmail(email);
  }

  return await insertVerificationToken(email, token, expires_at);
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

export async function updateVerificationDate(user_id: string, email: string) {
  try {
    return await db
      .update(UserTable)
      .set({ emailVerified: new Date(), email })
      .where(eq(UserTable.id, user_id));
  } catch {
    return null;
  }
}

export async function verifyUserEmail(user_id: string, email: string) {
  try {
    await updateVerificationDate(user_id, email);
    await deleteVerificationTokenByEmail(email);
  } catch {
    return ResponseFactory.error('Failed to verify email!');
  }
}
