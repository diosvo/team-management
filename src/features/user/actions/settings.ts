'use server';

import { User } from '@/drizzle/schema';
import { ResponseFactory } from '@/utils/response';

import { getUserById, updateUser } from '../db/auth';

export async function settings(values: Partial<User>) {
  // const user = await currentUser();
  const user = {
    id: '',
    isOAuth: false,
  };

  if (!user) {
    // logger.warn('Session expired, redirecting to login...');
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
