'use server';

import { sendPasswordInstructionEmail } from '@/lib/mail';
import { Response, ResponseFactory } from '@/utils/response';

import { User } from '@/drizzle/schema';
import { getTeam } from '@/features/team/actions/team';

import { hasPermissions } from '@/utils/helper';

import { revalidateRosterPath, revalidateUserTag } from '../db/cache';
import { insertCoach } from '../db/coach';
import { insertPlayer } from '../db/player';
import {
  deleteUser,
  getExistingEmails,
  getUsers,
  insertUser,
  updateUser,
} from '../db/user';
import {
  AddUserValues,
  EditPersonalInfoSchema,
  EditPersonalInfoValues,
  FilterUsersValues,
} from '../schemas/user';
import { generatePasswordToken } from './password-reset-token';

export async function getRoster(
  params: FilterUsersValues
): Promise<Array<User>> {
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
    const { isPlayer, isCoach } = hasPermissions(user.role);

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

    const withUser = { user_id: data.user_id };

    if (isPlayer) {
      const player = await insertPlayer(withUser);

      if (!player) {
        return ResponseFactory.error('Failed to extend user as player');
      }
    }

    if (isCoach) {
      const coach = await insertCoach(withUser);

      if (!coach) {
        return ResponseFactory.error('Failed to grant user as coach');
      }
    }

    const { email, token } = await generatePasswordToken(user.email);
    await sendPasswordInstructionEmail('reset', email, token);

    revalidateRosterPath();

    return ResponseFactory.success('Sent an email to with instructions');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function updatePersonalInfo(
  user_id: string,
  values: EditPersonalInfoValues
): Promise<Response> {
  const { data, error } = EditPersonalInfoSchema.safeParse(values);

  if (error) {
    return ResponseFactory.error(error.message);
  }

  try {
    await updateUser(user_id, data);

    revalidateUserTag(user_id);

    return ResponseFactory.success('Updated personal information successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function removeUser(user_id: string): Promise<Response> {
  try {
    await deleteUser(user_id);

    revalidateRosterPath();

    return ResponseFactory.success('User deleted successfully');
  } catch {
    return ResponseFactory.error('Failed to delete user');
  }
}
