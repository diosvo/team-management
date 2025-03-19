'use server';

import { AuthError } from 'next-auth';

import { signIn, signOut } from '@/auth';
import { generateVerificationToken } from '@/lib/token';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';
import { Response } from '@/utils/models';

import { sendVerificationEmail } from '@/lib/mail';
import { getUserByEmail, insertUser } from '../db/auth';
import {
  LoginSchema,
  LoginValues,
  RegisterSchema,
  RegisterValues,
} from '../schemas/auth';

export async function register(values: RegisterValues): Promise<Response> {
  const { success, data } = RegisterSchema.safeParse(values);

  if (!success) {
    return { error: true, message: 'An error occurred' };
  }

  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    return { error: true, message: 'Email already in use!' };
  }

  try {
    await insertUser(data);

    const { email, token } = await generateVerificationToken(data.email);
    await sendVerificationEmail(email, token);

    return {
      error: false,
      message: "We've sent an email to with instructions",
    };
  } catch (error) {
    return { error: true, message: (error as Error).message };
  }
}

export async function login(values: LoginValues) {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return { error: true, message: 'An error occurred' };
  }

  const { email, password } = data;

  const user = await getUserByEmail(email);

  if (!user?.emailVerified) {
    const token = generateVerificationToken(email);
    return { error: false, message: 'Confirmation email sent!' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin': {
          return { error: true, message: 'Invalid credentials' };
        }
        case 'AccessDenied': {
          return { error: true, message: 'Access Denied' };
        }
        default: {
          return { error: true, message: 'Something went wrong!' };
        }
      }
    }

    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: LOGIN_PATH });
}
