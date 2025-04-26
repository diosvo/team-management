'use server';

import { sendPasswordInstructionEmail } from '@/lib/mail';
import { Response, ResponseFactory } from '@/utils/response';

import { getTeam } from '@/features/team/actions/team';
import { revalidateAdminPath } from '../db/cache';
import { deleteUser, getUsers, insertUser, updateUser } from '../db/user';
import {
  AddUserValues,
  UpdateUserSchema,
  UpdateUserValues,
} from '../schemas/user';
import { generatePasswordToken } from './password-reset-token';

export async function getRoster() {
  return await getUsers();
}

export async function addUser(
  usersWithoutTeam: AddUserValues
): Promise<Response> {
  try {
    const team = await getTeam();

    if (!team) {
      return ResponseFactory.error('Team not found');
    }

    const user = {
      ...usersWithoutTeam,
      team_id: team.team_id,
    };

    const data = await insertUser(user);

    if (!data) {
      return ResponseFactory.error(
        'Failed to add user. Please check your input'
      );
    }

    const { email, token } = await generatePasswordToken(user.email);
    await sendPasswordInstructionEmail('reset', email, token);

    revalidateAdminPath();

    return ResponseFactory.success('Sent an email to with instructions');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function updateUserInfo(
  user_id: string,
  values: UpdateUserValues
): Promise<Response> {
  const { data, error } = UpdateUserSchema.safeParse(values);

  if (error) {
    return ResponseFactory.error(error.message);
  }

  try {
    await updateUser(user_id, data);

    return ResponseFactory.success('Updated information successfully');
  } catch {
    return ResponseFactory.error('Failed to update user');
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
