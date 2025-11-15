'use server';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTestType,
  getTestTypes as getAction,
  getTestTypeById,
  insertTestType,
  updateTestType,
} from '@/db/test-type';
import { UpsertTestTypeSchemaValues } from '@/schemas/periodic-testing';

import { ResponseFactory } from '@/utils/response';
import { withAuth } from './auth';
import { revalidate } from './cache';

export const getTestTypes = withAuth(async () => await getAction());

export const upsertTestType = withAuth(
  async ({ team_id }, type_id: string, data: UpsertTestTypeSchemaValues) => {
    try {
      const existingTestType = await getTestTypeById(type_id);

      if (existingTestType) {
        await updateTestType(existingTestType.type_id, data);
      } else {
        await insertTestType({
          ...data,
          team_id,
        });
      }

      revalidate.testTypes();

      return ResponseFactory.success('Test type updated successfully');
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  }
);

export const removeTestType = withAuth(async (_, type_id: string) => {
  try {
    await deleteTestType(type_id);

    revalidate.testTypes();

    return ResponseFactory.success('Test type removed successfully');
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    if (constraint === 'periodic_testing_test_type_id_fkey') {
      return ResponseFactory.error('Type is being in use.');
    }
    return ResponseFactory.error(message);
  }
});
