'use server';

import { ResponseFactory } from '@/utils/response';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTeam,
  getTeams as fetchTeams,
  insertTeam,
  updateTeam,
} from '@/db/team';
import { UpsertTeamSchemaValues } from '@/schemas/team';

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
