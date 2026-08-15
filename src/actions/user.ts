'use server';

import { forbidden, notFound } from 'next/navigation';

import type { CoachPosition, PlayerPosition } from '@/utils/enum';
import { ResponseFactory } from '@/utils/response';

import { insertCoach, updateCoach } from '@/db/coach';
import { getDbErrorMessage } from '@/db/pg-error';
import { insertPlayer, isJerseyNumberTaken, updatePlayer } from '@/db/player';
import {
  deleteUser,
  fetchActivePlayers,
  getUsers as fetchUsers,
  getRosterUsers,
  getUserById,
  updateUser,
} from '@/db/user';
import type {
  AddUserValues,
  EditPersonalInfoValues,
  EditTeamInfoValues,
} from '@/schemas/user';

import auth from '@/lib/auth';
import { deleteFile, getFile, uploadFile } from '@/lib/blob';
import { hasPermissions } from '@/utils/permissions';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const roster = withResource('roster');
const profile = withResource('profile');

export const getActivePlayers = withAuth(async ({ team_id }) => {
  if (!team_id) return [];
  return await fetchActivePlayers(team_id);
});

export const getUsers = withAuth(
  async ({ team_id }) => await fetchUsers(team_id),
);

export const getRoster = withAuth(
  async ({ team_id }) => await getRosterUsers(team_id),
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

export const addUser = roster(
  ['create'],
  async function add({ team_id }, values: AddUserValues) {
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

      return ResponseFactory.success('Sent an email with instructions');
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const getAvatar = profile(
  ['view'],
  async function getAvatar(_, image_path: Nullish<string>) {
    if (!image_path) return null;
    // Avatars live under users/ only — reject probes for other private blobs
    if (!image_path.startsWith('users/')) forbidden();

    return await getFile(image_path as string);
  },
);

export const uploadAvatar = profile(
  ['edit'],
  async function uploadAvatar(
    user,
    user_id: string,
    old_path: Nullish<string>,
    file: File,
  ) {
    // Avatars are self-service only
    if (user.id !== user_id) forbidden();

    // The blob we are about to delete must be the one this user currently owns.
    // A `users/<user_id>` prefix check is not enough: blob keys carry a random
    // suffix (`users/1-abc`), so `users/1` would also match `users/12-abc`.
    if (old_path) {
      const target = await getUserById(user_id);
      if (old_path !== target?.image) forbidden();
    }

    try {
      const { pathname } = await uploadFile('users/' + user_id, file, {
        contentType: file.type,
      });

      await updateUser(user_id, { image: pathname });

      if (old_path) {
        await deleteFile(old_path);
      }

      revalidate.user(user_id);

      return ResponseFactory.success('Uploaded avatar successfully', {
        image: pathname,
      });
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const updatePersonalInfo = profile(
  ['edit'],
  async function updatePersonal(
    user,
    user_id: string,
    values: EditPersonalInfoValues,
  ) {
    const { isAdmin } = hasPermissions(user.role);
    if (!isAdmin && user.id !== user_id) forbidden();

    try {
      await updateUser(user_id, values);

      revalidate.user(user_id);

      return ResponseFactory.success(
        'Updated personal information successfully',
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const updateTeamInfo = profile(
  ['edit'],
  async function updateTeam(user, user_id: string, values: EditTeamInfoValues) {
    const { isAdmin } = hasPermissions(user.role);
    // Non-admins may only edit themselves and never change their own role
    if (!isAdmin && (user.id !== user_id || values.user.role !== user.role)) {
      forbidden();
    }

    try {
      const { user: userData, player: playerData, coach: coachData } = values;

      // Update role-specific tables based on the user's role
      const { isPlayer, isCoach } = hasPermissions(userData.role);

      // Jersey numbers are unique within a team only
      if (isPlayer && playerData.jersey_number != null) {
        const taken = await isJerseyNumberTaken(
          user.team_id,
          playerData.jersey_number,
          user_id,
        );

        if (taken) {
          return ResponseFactory.error(
            `Jersey number '${playerData.jersey_number}' is already taken`,
          );
        }
      }

      // Update user
      await updateUser(user_id, userData);

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
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeUser = roster(
  ['delete'],
  async function remove(_, user_id: string) {
    try {
      await deleteUser(user_id);

      revalidate.roster();

      return ResponseFactory.success('User deleted successfully');
    } catch {
      return ResponseFactory.error('Failed to delete user');
    }
  },
);
