'use server';

import { AuthError } from 'next-auth';

import { signIn, signOut } from '@/auth';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/token';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';
import { Response, ResponseFactory } from '@/utils/response';

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
    return ResponseFactory.error('An error occurred');
  }

  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    return ResponseFactory.error('Email already in use!');
  }

  try {
    await insertUser(data);

    const { email, token } = await generateVerificationToken(data.email);
    await sendVerificationEmail(email, token);

    return ResponseFactory.success("We've sent an email to with instructions");
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function login(values: LoginValues) {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return ResponseFactory.error('An error occurred');
  }

  const user = await getUserByEmail(data.email);

  if (!user?.emailVerified) {
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

export async function logout() {
  await signOut({ redirectTo: LOGIN_PATH });
}
