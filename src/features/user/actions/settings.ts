'use server';

import { User } from '@/drizzle/schema';
import { ResponseFactory } from '@/utils/response';

import { getUserById, updateUser } from '../db/auth';
import { currentUser } from './auth';

export async function settings(values: Partial<User>) {
  const user = await currentUser();

  if (!user) {
    return ResponseFactory.error('Unauthorized');
  }

  const { id, isOAuth } = user;

  const dbUser = await getUserById(id!);

  if (!dbUser) {
    return ResponseFactory.error('User not found');
  }

  if (isOAuth) {
    values.email = undefined;
    // values.password = undefined;
  }

  await updateUser({
    ...dbUser,
    ...values,
  });

  return ResponseFactory.success('Update user successfully');
}
