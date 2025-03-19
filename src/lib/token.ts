import { eq } from 'drizzle-orm';
import { v4 as uuidV4 } from 'uuid';

import { db } from '@/drizzle';
import { VerificationTokenTable } from '@/drizzle/schema';
import { getVerificationTokenByEmail } from '@/features/user/db/verification-token';

export const generateVerificationToken = async (email: string) => {
  const token = uuidV4();
  const expires_at = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db
      .delete(VerificationTokenTable)
      .where(eq(VerificationTokenTable.email, email));
  }

  const [verificationToken] = await db
    .insert(VerificationTokenTable)
    .values({
      email,
      token,
      expires_at,
    })
    .returning();

  return verificationToken;
};
