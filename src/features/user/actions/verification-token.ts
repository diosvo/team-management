'use server';

import { ResponseFactory } from '@/utils/response';
import { Resend } from 'resend';

import EmailTemplate from '@/app/(auth)/_components/email-template';

import { getUserByEmail } from '../db/auth';
import {
  deleteVerificationTokenByEmail,
  getVerificationTokenByToken,
  updateVerificationDate,
} from '../db/verification-token';

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { email } = existingToken;

  try {
    await updateVerificationDate(existingUser.id, email);
    await deleteVerificationTokenByEmail(email);

    return ResponseFactory.success('Email verified successfully.');
  } catch {
    return ResponseFactory.error('Failed to verify email!');
  }
}
