'use server';

import { ResponseFactory } from '@/utils/response';

import { getUserByEmail } from '../db/auth';
import {
  getVerificationTokenByToken,
  verifyUserEmail,
} from '../db/verification-token';

export async function newVerification(token: string) {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return ResponseFactory.error('Invalid token!');
  }

  const hasExpired = new Date(existingToken.expires_at) < new Date();

  if (hasExpired) {
    return ResponseFactory.error(
      'Token has been expired! Please request a new one.'
    );
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return ResponseFactory.error('Email does not exist!');
  }

  await verifyUserEmail(existingUser, existingToken);

  return ResponseFactory.success('Email verified successfully!');
}
