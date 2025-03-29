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

  const dbUser = await getUserById(user.id!);

  if (!dbUser) {
    return ResponseFactory.error('User not found');
  }

  await updateUser({
    ...dbUser,
    ...values,
  });

  return ResponseFactory.success('Update user successfully');
}
