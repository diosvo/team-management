'use server';

import { Response } from '@/utils/models';

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

export async function login(values: LoginValues): Promise<Response> {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return { error: true, message: 'An error occurred' };
  }

  try {
    return {
      error: false,
      message: '',
    };
  } catch (error) {
    return { error: true, message: (error as Error).message };
  }
}
