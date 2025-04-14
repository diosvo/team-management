'use server';

import { sendPasswordInstructionEmail } from '@/lib/mail';
import { Response, ResponseFactory } from '@/utils/response';

import { revalidateAdminPath } from '../db/cache';
import { deleteUser, getUsers, insertUsers } from '../db/user';
import { AddUserValues } from '../schemas/user';
import { generatePasswordToken } from './password-reset-token';

export async function getRoster() {
  return await getUsers();
}

export async function addUsers(users: Array<AddUserValues>): Promise<Response> {
  try {
    await insertUsers(users);

    users.forEach(async (user) => {
      const { email, token } = await generatePasswordToken(user.email);
      await sendPasswordInstructionEmail('reset', email, token);
    });

    revalidateAdminPath();

    return ResponseFactory.success('Sent an email to with instructions');
  } catch {
    return ResponseFactory.error(
      'An error occurred while creating your account.'
    );
  }
}

export async function removeUser(user_id: string): Promise<Response> {
  try {
    await deleteUser(user_id);

    revalidateAdminPath();

    return ResponseFactory.success('User deleted successfully');
  } catch {
    return ResponseFactory.error('Failed to delete user');
  }
}
