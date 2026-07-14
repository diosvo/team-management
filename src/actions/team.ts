'use server';

import { ResponseFactory } from '@/utils/response';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTeam,
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
  async function upsert(
    _,
    team_id: string,
    team: UpsertTeamSchemaValues,
    file?: Nullable<File>,
  ) {
    try {
      let id = team_id;

      if (team_id) {
        await updateTeam(team_id, team);
      } else {
        const inserted = await insertTeam(team);
        id = inserted.team_id;
      }

      if (file) {
        const { pathname } = await uploadFile('teams/' + id, file, {
          contentType: file.type,
        });
        await updateTeam(id, { image: pathname });

        // Clean up the previously stored logo, if any.
        if (team.image) {
          await deleteFile(team.image);
        }
      }

      revalidate.teams();

      return ResponseFactory.success(
        `${team_id ? 'Updated' : 'Added'} team successfully`,
      );
    } catch (error) {
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
