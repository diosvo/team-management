import { v4 as uuidV4 } from 'uuid';

import {
  deleteVerificationTokenByEmail,
  getVerificationTokenByEmail,
  insertVerificationToken,
} from '@/features/user/db/verification-token';

export async function generateVerificationToken(email: string) {
  const token = uuidV4();
  const expires_at = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await deleteVerificationTokenByEmail(email);
  }

  return await insertVerificationToken(email, token, expires_at);
}
