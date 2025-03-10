'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { Response } from '@/utils/models';

import { db } from '@/db';
import { UserTable } from '@/db/schema';

import { LoginSchema, LoginValues } from '../schemas/auth';

export async function register(values: LoginValues): Promise<Response> {
  const { success, data } = LoginSchema.safeParse(values);

  if (!success) {
    return { error: true, message: 'An error occurred' };
  }

  const { email, password } = data;
  const hashedPassword = await bcrypt.hash(password, 9);

  const existingUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, email),
  });

  try {
    return {
      error: false,
      message: "We've sent an email to with instructions",
    };
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
      message: "We've sent an email to with instructions",
    };
  } catch (error) {
    return { error: true, message: (error as Error).message };
  }
}
