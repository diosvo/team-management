'use server';

import { EXPIRES_AT } from '@/utils/constant';
import { v4 as uuidV4 } from 'uuid';

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

  return await insertAction(email, uuidV4(), EXPIRES_AT);
}
