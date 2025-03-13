'use server';

import { signIn, signOut } from '@/auth';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';
import { Response } from '@/utils/models';

import { AuthError } from 'next-auth';
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
    return {
      error: false,
      message: "We've sent an email to with instructions",
    };
    // TODO: send email verification
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
        default: {
          return { error: true, message: 'Something went wrong!' };
        }
      }
    }

    throw error;
  }
}

export async function logout() {
  // Should it be a landing page?
  await signOut({ redirectTo: LOGIN_PATH });
}
