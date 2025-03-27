'use server';

import { EXPIRES_AT, UUID } from '@/utils/constant';

import {
  deletePasswordResetTokenByEmail as deleteAction,
  getPasswordResetTokenByEmail as getAction,
  insertPasswordResetToken as insertAction,
} from '../db/password-reset-token';

export async function generatePasswordToken(email: string) {
  const existingToken = await getAction(email);

  if (existingToken) {
    await deleteAction(email);
  }

  return await insertAction(email, UUID, EXPIRES_AT);
}
