'use server';

import { User } from '@/drizzle/schema';
import { getTeam } from '@/features/team/actions/team';
import { sendPasswordInstructionEmail } from '@/lib/mail';

import { CoachPosition, PlayerPosition } from '@/utils/enum';
import { hasPermissions } from '@/utils/helper';
import { Response, ResponseFactory } from '@/utils/response';

import {
  AddUserValues,
  EditPersonalInfoSchema,
  EditPersonalInfoValues,
  EditTeamInfoSchema,
  EditTeamInfoValues,
  FilterUsersValues,
} from '../schemas/user';
import { generatePasswordToken } from './password-reset-token';

import { revalidateRosterPath, revalidateUserTag } from '../db/cache';
import { insertCoach, updateCoach } from '../db/coach';
import { insertPlayer, updatePlayer } from '../db/player';
import {
  deleteUser,
  getExistingEmails,
  getUsers,
  insertUser,
  updateUser,
} from '../db/user';

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

    if (isPlayer) {
      const player = await insertPlayer({
        user_id: data.user_id,
        position: user.position as PlayerPosition,
      });

      if (!player) {
        return ResponseFactory.error('Failed to extend user as player');
      }
    }

    if (isCoach) {
      const coach = await insertCoach({
        user_id: data.user_id,
        position: user.position as CoachPosition,
      });

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

export async function updateTeamInfo(
  user_id: string,
  values: EditTeamInfoValues
): Promise<Response> {
  const { data, error } = EditTeamInfoSchema.safeParse(values);

  if (error) {
    return ResponseFactory.error(error.message);
  }

  try {
    const { user: userData, player: playerData, position } = data;

    // Update user
    await updateUser(user_id, userData);

    // Update role-specific tables based on the user's role
    const { isPlayer, isCoach } = hasPermissions(userData.role);

    if (isPlayer && playerData) {
      await updatePlayer({
        user_id,
        position: position as PlayerPosition,
        jersey_number: playerData.jersey_number,
      });
    }

    if (isCoach && position) {
      await updateCoach({
        user_id,
        position: position as CoachPosition,
      });
    }

    revalidateUserTag(user_id);

    return ResponseFactory.success('Updated team information successfully');
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
