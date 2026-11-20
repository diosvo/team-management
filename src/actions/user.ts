'use server';

import { forbidden, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { isEmptyObject } from 'es-toolkit';

import { toIsoDay } from '@/utils/datetime';
import { UserState } from '@/utils/enum';
import { maskId } from '@/utils/formatter';
import { hasPermissions } from '@/utils/permissions';
import { ResponseFactory } from '@/utils/response';

import {
  deleteFile,
  getFile,
  ImageValidationError,
  uploadImage,
} from '@/lib/storage';

import { getDbErrorMessage } from '@/db/pg-error';
import { isJerseyNumberTaken } from '@/db/player';
import {
  selectActivePlayers,
  selectRegistrationPlayers,
  selectRosterUsers,
  selectUserById,
  selectUsers,
  updateUser,
  updateUserTeamInfo,
} from '@/db/user';
import type {
  EditPersonalInfoValues,
  EditTeamInfoValues,
} from '@/schemas/user';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const profile = withResource('profile');
const registration = withResource('registration');

export const getActivePlayers = withAuth(async ({ team_id }) => {
  if (!team_id) return [];
  return await selectActivePlayers(team_id);
});

/**
 * Full player rows (dob, phone, citizen id) for the registration export,
 * limited to the selected players and to roles that can file a registration.
 */
export const getRegistrationPlayers = registration(
  ['create'],
  async function registrationPlayers({ team_id }, ids: Array<string>) {
    if (!team_id) return [];
    return await selectRegistrationPlayers(team_id, ids);
  },
);

export const getUsers = withAuth(
  async ({ team_id }) => await selectUsers(team_id),
);

export const getRoster = withAuth(
  async ({ team_id }) => await selectRosterUsers(team_id),
);

export const getUserProfile = withAuth(async (user, target_id: string) => {
  const { isPlayer, isCoach, isGuest, isAdmin } = hasPermissions(user.role);
  if (isGuest) forbidden();

  const targetUser = await selectUserById(target_id);
  if (!targetUser) notFound();

  // Do NOT enable button if:
  // 1. Current profile is Admin
  // 2. View only mode
  const isOwnProfile = user.id === targetUser.id;
  const viewOnly =
    (isAdmin && isOwnProfile) || ((isPlayer || isCoach) && !isOwnProfile);

  // The full citizen ID goes to the member (to edit it) and to admins and
  // captains (to reveal it). Everyone else gets it masked here, so the full
  // number never reaches their browser.
  const { citizen_identification } = targetUser;
  const showCitizenId = isAdmin || isOwnProfile || !!user.is_captain;

  return {
    targetUser:
      showCitizenId || !citizen_identification
        ? targetUser
        : {
            ...targetUser,
            citizen_identification: maskId(citizen_identification),
          },
    viewOnly,
  };
});

export const getAvatar = profile(
  ['view'],
  async function getAvatar(_, image_path: Nullish<string>) {
    if (!image_path) return null;
    // users/<user_id> only
    // reject any path traversal attempts
    if (
      !image_path.startsWith('users/') ||
      image_path.includes('..') ||
      image_path.startsWith('/') ||
      image_path.includes('\\')
    )
      forbidden();

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

    const t = await getTranslations('actions.user');

    // The file we are about to delete must be the one this user currently owns.
    // A `users/<user_id>` prefix check is not enough: legacy keys carry a random
    // suffix (`users/1-abc`), so `users/1` would also match `users/12-abc`.
    if (old_path) {
      const target = await selectUserById(user_id);
      if (old_path !== target?.image) forbidden();
    }

    try {
      const { pathname } = await uploadImage('users/' + user_id, file);

      await updateUser(user_id, { image: pathname });

      if (old_path) {
        await deleteFile(old_path);
      }

      revalidate.user(user_id);

      return ResponseFactory.success(t('avatarUploaded'), {
        image: pathname,
      });
    } catch (error) {
      if (error instanceof ImageValidationError) {
        const tUpload = await getTranslations('actions.upload');
        return ResponseFactory.error(tUpload(error.reason));
      }
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

    const t = await getTranslations('actions.user');

    try {
      await updateUser(user_id, values);

      revalidate.user(user_id);

      return ResponseFactory.success(t('personalInfoUpdated'));
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

    // The current role tells which row to remove when switching role
    const target = await selectUserById(user_id);
    if (!target) notFound();

    const t = await getTranslations('actions.user');

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
            t('jerseyTaken', { number: playerData.jersey_number }),
          );
        }
      }

      // Switching role removes the previous role's row
      const previous = hasPermissions(target.role);
      const switching = target.role !== userData.role;

      // `join_date` belongs to the open membership stint, so it is corrected
      // there instead of on the user row.
      const { join_date, ...userColumns } = userData;

      // Going inactive closes the open stint today; coming back opens a new
      // one, so the team history keeps every period the member played.
      const today = toIsoDay(new Date());
      const leaving =
        target.state !== UserState.INACTIVE &&
        userData.state === UserState.INACTIVE;
      // `join_date` is only set while a stint is open; older inactive rows may
      // still have one, and those just carry on.
      const returning =
        target.state === UserState.INACTIVE &&
        userData.state !== UserState.INACTIVE &&
        !target.join_date;

      const membership = {
        ...(join_date && !returning && { join_date }),
        ...(leaving && { leave_date: today }),
      };

      await updateUserTeamInfo(user_id, {
        user: userColumns,
        membership: isEmptyObject(membership) ? undefined : membership,
        rejoin: returning
          ? { team_id: target.team_id, join_date: today }
          : undefined,
        player: isPlayer ? playerData : undefined,
        coach: isCoach ? coachData : undefined,
        remove: {
          player: switching && previous.isPlayer,
          coach: switching && previous.isCoach,
        },
      });

      revalidate.user(user_id);

      return ResponseFactory.success(t('teamInfoUpdated'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
