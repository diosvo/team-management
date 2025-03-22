'use server';

import { ResponseFactory } from '@/utils/response';
import { Resend } from 'resend';

import EmailTemplate from '@/app/(auth)/_components/email-template';

import { getUserByEmail } from '../db/auth';
import {
  getVerificationTokenByToken,
  verifyUserEmail,
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

  await verifyUserEmail(existingUser.id, existingToken.email);

  return ResponseFactory.success('Email verified successfully!');
}

export async function sendVerificationEmail(email: string, token: string) {
  const name = email.split('@')[0];

  await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: email,
    subject: 'Email Confirmation',
    html: EmailTemplate({ token, name }),
  });
}
