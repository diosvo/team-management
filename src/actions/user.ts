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
  fetchActivePlayers,
  getUserById,
  getUsers,
  updateUser,
} from '@/db/user';
import {
  AddUserValues,
  EditPersonalInfoValues,
  EditTeamInfoValues,
} from '@/schemas/user';

import auth from '@/lib/auth';
import { withAuth } from './auth';
import { revalidate } from './cache';

export const getActivePlayers = withAuth(
  async ({ team_id }) => await fetchActivePlayers(team_id),
);

export const getRoster = withAuth(
  async ({ team_id }) => await getUsers(team_id),
);

export const getUserProfile = withAuth(async (user, target_id: string) => {
  const { isPlayer, isCoach, isGuest, isAdmin } = hasPermissions(user.role);
  if (isGuest) forbidden();

  const targetUser = await getUserById(target_id);
  if (!targetUser) notFound();

  // Do NOT enable button if:
  // 1. Current profile is Admin
  // 2. View only mode
  const isOwnProfile = user.id === targetUser.id;
  const viewOnly =
    (isAdmin && isOwnProfile) || ((isPlayer || isCoach) && !isOwnProfile);

  return {
    targetUser,
    viewOnly,
  };
});

export const addUser = withAuth(async ({ team_id }, values: AddUserValues) => {
  try {
    const user = {
      ...values,
      team_id,
    };
    const { isPlayer, isCoach } = hasPermissions(user.role);

    const data = await auth.api.signUpEmail({
      body: {
        ...user,
        password: 'TemporaryPassword123!',
      },
    });

    if (isPlayer) {
      await insertPlayer({
        id: data.user.id,
        position: user.position as PlayerPosition,
      });
    }

    if (isCoach) {
      await insertCoach({
        id: data.user.id,
        position: user.position as CoachPosition,
      });
    }

    await auth.api.requestPasswordReset({
      body: {
        email: values.email,
        redirectTo: '/new-password',
      },
    });

    revalidate.roster();

    return ResponseFactory.success('Sent an email to with instructions');
  } catch (error) {
    const { message } = getDbErrorMessage(error);
    return ResponseFactory.error(message);
  }
});

export const updatePersonalInfo = withAuth(
  async (_, user_id: string, values: EditPersonalInfoValues) => {
    try {
      await updateUser(user_id, values);

      revalidate.user(user_id);

      return ResponseFactory.success(
        'Updated personal information successfully',
      );
    } catch (error) {
      return ResponseFactory.fromError(error as Error);
    }
  },
);

export const updateTeamInfo = withAuth(
  async (_, user_id: string, values: EditTeamInfoValues) => {
    try {
      const { user: userData, player: playerData, coach: coachData } = values;

      // Update user
      await updateUser(user_id, userData);

      // Update role-specific tables based on the user's role
      const { isPlayer, isCoach } = hasPermissions(userData.role);

      // TODO: Create new player or coach if they don't exist
      // Remove the old one when switching role

      if (isPlayer) {
        await updatePlayer({
          id: user_id,
          ...playerData,
        });
      }

      if (isCoach) {
        await updateCoach({
          id: user_id,
          ...coachData,
        });
      }

      revalidate.user(user_id);

      return ResponseFactory.success('Updated team information successfully');
    } catch (error) {
      const { message, constraint } = getDbErrorMessage(error);

      if (constraint === 'player_jersey_number_unique') {
        return ResponseFactory.error(
          `Jersey number '${values.player.jersey_number}' is already taken`,
        );
      }
      return ResponseFactory.error(message);
    }
  },
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
