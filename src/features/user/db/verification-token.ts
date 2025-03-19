import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { VerificationTokenTable } from '@/drizzle/schema';

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await db.query.VerificationTokenTable.findFirst({
      where: eq(VerificationTokenTable.token, token),
    });

    return verificationToken;
  } catch {
    return null;
  }
};

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await db.query.VerificationTokenTable.findFirst({
      where: eq(VerificationTokenTable.email, email),
    });

    return verificationToken;
  } catch {
    return null;
  }
};
