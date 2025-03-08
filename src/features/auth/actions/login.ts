'use server';

import { Response } from '@/utils/models';

import { LoginSchema, LoginValues } from '../schemas/auth';

export async function login(values: LoginValues): Promise<Response> {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return { error: true, message: 'An error occurred' };
  }

  try {
    return {
      error: false,
      message: "We've sent an email to with instructions",
    };
  } catch (error) {
    return { error: true, message: (error as Error).message };
  }
}
