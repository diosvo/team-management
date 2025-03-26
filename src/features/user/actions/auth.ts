'use server';

import { AuthError } from 'next-auth';

import { signIn, signOut } from '@/auth';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/mail';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';
import { Response, ResponseFactory } from '@/utils/response';

import { getUserByEmail, insertUser } from '../db/auth';
import {
  LoginSchema,
  LoginValues,
  RegisterSchema,
  RegisterValues,
  ResetPasswordSchema,
  ResetPasswordValue,
} from '../schemas/auth';
import { generatePasswordToken } from './password-reset-token';
import { generateVerificationToken } from './verification-token';

export async function register(values: RegisterValues): Promise<Response> {
  const { success, data } = RegisterSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error();
  }

  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    return ResponseFactory.error('Email already in use!');
  }

  try {
    const { email, token } = await generateVerificationToken(data.email);
    // Send verification email before inserting user
    await sendVerificationEmail(email, token);

    // Only insert user if email was sent successfully
    await insertUser(data);

    return ResponseFactory.success("We've sent an email to with instructions");
  } catch {
    return ResponseFactory.error();
  }
}

export async function login(values: LoginValues) {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error();
  }

  const user = await getUserByEmail(data.email);

  if (!user) {
    return ResponseFactory.error('Cannot find email. Please sign up.');
  }

  if (user && !user.emailVerified) {
    const { email, token } = await generateVerificationToken(data.email);
    await sendVerificationEmail(email, token);

    return ResponseFactory.success('Confirmation email sent!');
  }

  try {
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin': {
          return ResponseFactory.error('Invalid credentials');
        }
        case 'AccessDenied': {
          return ResponseFactory.error('Access Denied');
        }
        default: {
          return ResponseFactory.error('Something went wrong!');
        }
      }
    }

    throw error;
  }
}

export async function resetPassword(values: ResetPasswordValue) {
  const { success, data } = ResetPasswordSchema.safeParse(values);

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

export async function logout() {
  await signOut({ redirectTo: LOGIN_PATH });
}
