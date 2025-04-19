'use server';

import { redirect } from 'next/navigation';

import { compare, hash } from 'bcryptjs';

import logger from '@/lib/logger';
import { sendPasswordInstructionEmail } from '@/lib/mail';
import { createSession, deleteSession, verifySession } from '@/lib/session';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';
import { ResponseFactory } from '@/utils/response';

import {
  deletePasswordResetTokenByEmail,
  getPasswordResetTokenByToken,
} from '../db/password-reset-token';
import { getUserByEmail, getUserById, updateUser } from '../db/user';
import {
  LoginSchema,
  LoginValues,
  PasswordSchema,
  PasswordValue,
} from '../schemas/auth';
import { generatePasswordToken } from './password-reset-token';

export async function login(values: LoginValues) {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error();
  }

  const user = await getUserByEmail(data.email);

  if (!user) {
    return ResponseFactory.error(
      'Cannot find email. Please contact the administrator to register.'
    );
  }

  if (!user?.password) {
    return ResponseFactory.error('Please create your password first.');
  }

  const matcher = await compare(data.password, user.password);

  if (!matcher) {
    return ResponseFactory.error('Invalid credentials.');
  }

  try {
    await createSession(user.user_id);
  } catch (error) {
    logger.error('Failed to create session', error);
    return ResponseFactory.error('Something went wrong!');
  }

  redirect(DEFAULT_LOGIN_REDIRECT);
}

export async function getUser() {
  // Verify user's session
  const session = await verifySession();

  // Logout if session has been expired
  if (!session) {
    logger.info('Session has been expired. Redirecting to login page...');
    redirect(LOGIN_PATH);
  }

  const user = await getUserById(session.user_id);
  if (!user) return null;

  return user;
}

export async function requestResetPassword(values: LoginValues) {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error('Email is invalid.');
  }

  const user = await getUserByEmail(data.email);

  if (!user) {
    return ResponseFactory.error('Cannot find email. Please sign up.');
  }

  const { email, token } = await generatePasswordToken(data.email);
  await sendPasswordInstructionEmail('reset', email, token);

  return ResponseFactory.success('Reset email sent.');
}

export async function changePassword(value: PasswordValue, token?: string) {
  if (!token) {
    return ResponseFactory.error('Missing token to verify.');
  }

  const { success, data } = PasswordSchema.safeParse(value);

  if (!success) {
    return ResponseFactory.error('Password validation failed.');
  }

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return ResponseFactory.error('Token is invalid!');
  }

  const hasExpired = new Date(existingToken.expires_at) < new Date();

  if (hasExpired) {
    return ResponseFactory.error('Token has expired! ');
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return ResponseFactory.error('Email does not exist!');
  }

  try {
    await updateUser({
      ...existingUser,
      password: await hash(data.password, 10),
    });
    await deletePasswordResetTokenByEmail(existingToken.email);

    return ResponseFactory.success(
      'Password has been reset. Please back to login page.'
    );
  } catch {
    return ResponseFactory.error('Failed to reset password!');
  }
}

export async function logout() {
  await deleteSession();
  redirect(LOGIN_PATH);
}
