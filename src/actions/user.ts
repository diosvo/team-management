'use server';

import { forbidden, notFound } from 'next/navigation';

import { CoachPosition, PlayerPosition } from '@/utils/enum';
import { hasPermissions } from '@/utils/helper';
import { ResponseFactory } from '@/utils/response';

import { insertCoach, updateCoach } from '@/db/coach';
import { getDbErrorMessage } from '@/db/pg-error';
import { insertPlayer, updatePlayer } from '@/db/player';
import {
  deleteUser,
  getExistingEmails,
  getUserById,
  getUsers,
  updateUser,
} from '@/db/user';
import {
  AddUserValues,
  EditPersonalInfoSchema,
  EditPersonalInfoValues,
  EditTeamInfoSchema,
  EditTeamInfoValues,
  FilterUsersValues,
} from '@/schemas/user';

import auth from '@/lib/auth';
import { withAuth } from './auth';
import { getCacheTag, revalidate } from './cache';

export const getRoster = withAuth(
  async (_, params: FilterUsersValues) => await getUsers(params)
);

export const getUserProfile = withAuth(async (user, target_id: string) => {
  const targetUser = await getUserById(target_id);
  if (!targetUser) notFound();

  const { isPlayer, isGuest } = hasPermissions(user.role);
  if (isGuest) forbidden();

  const isOwnProfile = user.id === targetUser.id;
  const viewOnly = isPlayer && !isOwnProfile;

  return {
    targetUser,
    viewOnly,
    isOwnProfile,
  };
});

export const addUser = withAuth(async ({ team_id }, values: AddUserValues) => {
  try {
    const user = {
      ...values,
      team_id,
    };
    const { isPlayer, isCoach } = hasPermissions(user.role);

    const existingEmails = await getExistingEmails();

    if (existingEmails.includes(user.email)) {
      return ResponseFactory.error('Email already exists');
    }

    const data = await auth.api.signUpEmail({
      body: {
        ...user,
        password: 'TemporaryPassword123!',
      },
    });

    if (isPlayer) {
      const player = await insertPlayer({
        id: data.user.id,
        position: user.position as PlayerPosition,
      });

      if (!player) {
        return ResponseFactory.error('Failed to extend user as player');
      }
    }

    if (isCoach) {
      const coach = await insertCoach({
        id: data.user.id,
        position: user.position as CoachPosition,
      });

      if (!coach) {
        return ResponseFactory.error('Failed to grant user as coach');
      }
    }

    await auth.api.forgetPassword({
      body: {
        email: values.email,
        redirectTo: '/new-password',
      },
    });

    revalidate.roster();

    return ResponseFactory.success('Sent an email to with instructions');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
});

export const updatePersonalInfo = withAuth(
  async (_, user_id: string, values: EditPersonalInfoValues) => {
    const { data, error } = EditPersonalInfoSchema.safeParse(values);

    if (error) {
      return ResponseFactory.error(error.message);
    }

    try {
      await updateUser(user_id, data);

      getCacheTag.user(user_id);

      return ResponseFactory.success(
        'Updated personal information successfully'
      );
    } catch (error) {
      return ResponseFactory.fromError(error as Error);
    }
  }
);

export const updateTeamInfo = withAuth(
  async (_, user_id: string, values: EditTeamInfoValues) => {
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

      // TODO: Create new player or coach if they don't exist

      if (isPlayer && playerData) {
        await updatePlayer({
          id: user_id,
          position: position as PlayerPosition,
          jersey_number: playerData.jersey_number,
        });
      }

      if (isCoach && position) {
        await updateCoach({
          id: user_id,
          position: position as CoachPosition,
        });
      }

      getCacheTag.user(user_id);

      return ResponseFactory.success('Updated team information successfully');
    } catch (error) {
      const { message, constraint } = getDbErrorMessage(error);

      if (constraint === 'player_jersey_number_unique') {
        return ResponseFactory.error(
          `Jersey number '${data.player.jersey_number}' is already taken.`
        );
      }
      return ResponseFactory.error(message);
    }
  }
);

export const removeUser = withAuth(async (_, user_id: string) => {
  try {
    await deleteUser(user_id);

    revalidate.roster();

    return ResponseFactory.success('User deleted successfully');
  } catch {
    return ResponseFactory.error('Failed to delete user');
  }
});
