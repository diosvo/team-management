'use server';

import { sendPasswordInstructionEmail } from '@/lib/mail';
import { UserRole } from '@/utils/enum';
import { Response, ResponseFactory } from '@/utils/response';

import { getTeam } from '@/features/team/actions/team';

import { revalidateAdminPath } from '../db/cache';
import { insertCoach } from '../db/coach';
import { insertPlayer, updatePlayer } from '../db/player';
import {
  deleteUser,
  getExistingEmails,
  getUsers,
  insertUser,
  updateUser,
} from '../db/user';
import {
  AddUserValues,
  EditProfileSchema,
  EditProfileValues,
  FilterUsersValues,
} from '../schemas/user';
import { generatePasswordToken } from './password-reset-token';

export async function getRoster(params: FilterUsersValues) {
  return await getUsers(params);
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

    const existingEmails = await getExistingEmails();

    if (existingEmails.includes(user.email)) {
      return ResponseFactory.error('Email already exists');
    }

    const data = await insertUser(user);

    if (!data) {
      return ResponseFactory.error(
        'Failed to add user. Please check your input'
      );
    }

    if (user.roles.includes(UserRole.PLAYER)) {
      const player = await insertPlayer({ user_id: data.user_id });

      if (!player) {
        return ResponseFactory.error('Failed to extend user as player');
      }
    }

    if (user.roles.includes(UserRole.COACH)) {
      const coach = await insertCoach({
        user_id: data.user_id,
        position: user.coach_position,
      });

      if (!coach) {
        return ResponseFactory.error('Failed to grant user as coach');
      }
    }

    const { email, token } = await generatePasswordToken(user.email);
    await sendPasswordInstructionEmail('reset', email, token);

    revalidateAdminPath();

    return ResponseFactory.success('Sent an email to with instructions');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function updateProfile(
  user_id: string,
  values: EditProfileValues
): Promise<Response> {
  const { data, error } = EditProfileSchema.safeParse(values);

  if (error) {
    return ResponseFactory.error(error.message);
  }

  try {
    const { jersey_number, height, weight, ...userData } = data;

    await updateUser(user_id, userData);
    await updatePlayer({ user_id, jersey_number, height, weight });

    return ResponseFactory.success('Updated information successfully');
  } catch (error) {
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
