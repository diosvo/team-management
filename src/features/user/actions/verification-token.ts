'use server';

import { EXPIRES_AT, UUID } from '@/utils/constant';
import { ResponseFactory } from '@/utils/response';

import { getUserByEmail } from '../db/auth';
import {
  deleteVerificationToken as deleteAction,
  getVerificationTokenByEmail as getByEmailAction,
  getVerificationTokenByToken as getByTokenAction,
  insertVerificationToken as insertAction,
  updateVerificationDate as updateDateAction,
} from '../db/verification-token';

export async function generateVerificationToken(email: string) {
  const existingToken = await getByEmailAction(email);

  if (existingToken) {
    await deleteAction(email);
  }

  return await insertAction(email, UUID, EXPIRES_AT);
}

export async function newVerification(token: string) {
  const existingToken = await getByTokenAction(token);

  if (!existingToken) {
    return ResponseFactory.error('Invalid token!');
  }

  const hasExpired = new Date(existingToken.expires_at) < new Date();

  if (hasExpired) {
    return ResponseFactory.error(
      'Token has expired! Please request a new one.'
    );
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return ResponseFactory.error('Email does not exist!');
  }

  const { email } = existingToken;

  try {
    await updateDateAction(existingUser.id, email);
    await deleteAction(email);

    return ResponseFactory.success('Email verified successfully.');
  } catch {
    return ResponseFactory.error('Failed to verify email!');
  }
}
