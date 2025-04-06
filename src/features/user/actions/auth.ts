'use server';

import { sendPasswordResetEmail } from '@/lib/mail';
import { ResponseFactory } from '@/utils/response';

import { getUserByEmail, hashPassword, updateUser } from '../db/auth';
import {
  deletePasswordResetTokenByEmail,
  getPasswordResetTokenByToken,
} from '../db/password-reset-token';
import {
  EmailSchema,
  EmailValue,
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
    return ResponseFactory.error('Cannot find email. Please sign up.');
  }

  if (user && !user.password) {
    return ResponseFactory.error('Please create your password first.');
  }

  try {
    // await signIn('credentials', {
    //   email: data.email,
    //   password: data.password,
    //   redirectTo: DEFAULT_LOGIN_REDIRECT,
    // });
  } catch {
    return ResponseFactory.error('Something went wrong!');
  }
}

export async function requestResetPassword(values: EmailValue) {
  const { success, data } = EmailSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error('Email is invalid.');
  }

  const user = await getUserByEmail(data.email);

  if (!user) {
    return ResponseFactory.error('Cannot find email. Please sign up.');
  }

  const { email, token } = await generatePasswordToken(data.email);
  await sendPasswordResetEmail(email, token);

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
      password: await hashPassword(data.password),
    });
    await deletePasswordResetTokenByEmail(existingToken.email);

    return ResponseFactory.success('Password update successfully.');
  } catch {
    return ResponseFactory.error('Failed to reset password!');
  }
}

export async function logout() {
  // Some server stuff if needed
}
