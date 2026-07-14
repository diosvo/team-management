'use server';

import { ResponseFactory } from '@/utils/response';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTeam,
  getTeam,
  getTeams as fetchTeams,
  insertTeam,
  updateTeam,
} from '@/db/team';
import type { UpsertTeamSchemaValues } from '@/schemas/team';

import { deleteFile, uploadFile } from '@/lib/blob';
import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const teams = withResource('teams');

/** @returns A list of teams as opponents */
export const getTeams = withAuth(fetchTeams);

export const upsertTeam = teams(
  ['create', 'edit'],
  async function upsert(_, team_id: string, values: UpsertTeamSchemaValues) {
    try {
      const { image, ...rest } = values;
      let id = team_id;
      let previousImage: Nullable<string> = null;

      if (team_id) {
        // Capture the currently stored logo so it can be cleaned up if replaced.
        previousImage = (await getTeam(team_id))?.image ?? null;
        await updateTeam(team_id, rest);
      } else {
        const inserted = await insertTeam(rest);
        id = inserted.team_id;
      }

      // Only a freshly selected File needs uploading; an unchanged logo arrives
      // as its existing pathname string and must be left untouched.
      if (image instanceof File) {
        const { pathname } = await uploadFile('teams/' + id, image);
        await updateTeam(id, { image: pathname });

        // Clean up the previously stored logo, if any.
        if (previousImage) {
          await deleteFile(previousImage);
        }
      }

      revalidate.teams();

      return ResponseFactory.success(
        `${team_id ? 'Updated' : 'Added'} team successfully`,
      );
    } catch (error) {
      console.log('--->', error);

      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeTeam = teams(
  ['delete'],
  async function remove(_, team_id: string) {
    try {
      await deleteTeam(team_id);

      revalidate.teams();

      return ResponseFactory.success('Deleted team successfully');
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
