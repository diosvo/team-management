'use server';

import { deleteFile, getFile, uploadFile } from '@/lib/blob';
import { ResponseFactory } from '@/utils/response';

import { countTeamMatches } from '@/db/match';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTeam,
  getTeams as fetchTeams,
  insertTeam,
  updateTeam,
} from '@/db/team';
import type { UpsertTeamSchemaValues } from '@/schemas/team';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const teams = withResource('teams');

/** @returns A list of teams as opponents */
export const getTeams = withAuth(fetchTeams);

export const upsertTeam = teams(
  ['create', 'edit'],
  async function upsert(_, team_id: string, team: UpsertTeamSchemaValues) {
    try {
      if (team_id) {
        await updateTeam(team_id, team);
      } else {
        await insertTeam(team);
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

export const getLogo = teams(
  ['view'],
  async function getAvatar(_, image: Nullish<string>) {
    if (!image) return null;

    return await getFile(image);
  },
);

export const uploadLogo = teams(
  ['create', 'edit'],
  async function upload(
    _,
    team_id: string,
    old_path: Nullish<string>,
    file: File,
  ) {
    try {
      const { pathname } = await uploadFile('teams/' + team_id, file, {
        contentType: file.type,
      });

      await updateTeam(team_id, { image: pathname });

      if (old_path) {
        await deleteFile(old_path);
      }

      revalidate.teams();

      return ResponseFactory.success('Uploaded logo successfully', {
        image: pathname,
      });
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
      // `match.home_team` / `away_team` are `restrict`: without this the
      // delete comes back as a raw foreign key error naming a constraint.
      const played = await countTeamMatches(team_id);

      if (played > 0) {
        return ResponseFactory.error(
          `This team appears in ${played} match(es). Delete those matches first, or keep the team to preserve the record.`,
        );
      }

      await deleteTeam(team_id);

      revalidate.teams();

      return ResponseFactory.success('Deleted team successfully');
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
