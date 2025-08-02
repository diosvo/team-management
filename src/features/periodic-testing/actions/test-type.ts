'use server';

import pg from 'pg';

import { Response, ResponseFactory } from '@/utils/response';

import { getTeam } from '@/features/team/actions/team';

import { revalidateTestTypesPath } from '../db/cache';
import {
  deleteTestType,
  getTestTypes as getAction,
  getTestTypeById,
  insertTestType,
  updateTestType,
} from '../db/test-type';
import { UpsertTestTypeSchemaValues } from '../schemas/periodic-testing';

export async function getTestTypes() {
  const team = await getTeam();
  if (!team) return [];

  return await getAction();
}

export async function upsertTestType(
  type_id: string,
  data: UpsertTestTypeSchemaValues
): Promise<Response> {
  const team = await getTeam();

  if (!team) {
    return ResponseFactory.error('Team not found');
  }

  try {
    const existingTestType = await getTestTypeById(type_id);

    if (existingTestType) {
      await updateTestType(existingTestType.type_id, data);
    } else {
      await insertTestType({
        ...data,
        team_id: team.team_id,
      });
    }

    revalidateTestTypesPath();

    return ResponseFactory.success('Test type updated successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function removeTestType(type_id: string): Promise<Response> {
  const type = await getTestTypeById(type_id);

  if (!type) {
    return ResponseFactory.error('Test type not found');
  }

  try {
    await deleteTestType(type.type_id);

    revalidateTestTypesPath();

    return ResponseFactory.success('Test type removed successfully');
  } catch (error) {
    // PostgreSQL error code for foreign key violation
    if (error instanceof pg.DatabaseError && error.code === '23503') {
      return ResponseFactory.error(`'${type.name}' is in use.`);
    }
    return ResponseFactory.fromError(error as Error);
  }
}
