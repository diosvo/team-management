'use server';

import { Response, ResponseFactory } from '@/utils/response';

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
  return await getAction();
}

export async function upsertTestType(
  type_id: string,
  data: UpsertTestTypeSchemaValues
): Promise<Response> {
  try {
    const existingTestType = await getTestTypeById(type_id);

    if (existingTestType) {
      await updateTestType(existingTestType.type_id, data);
    } else {
      await insertTestType(data);
    }

    revalidateTestTypesPath();

    return ResponseFactory.success('Test type updated successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function removeTestType(type_id: string): Promise<Response> {
  try {
    const type = await getTestTypeById(type_id);

    if (!type) {
      return ResponseFactory.error('Test type not found');
    }

    await deleteTestType(type.type_id);

    revalidateTestTypesPath();

    return ResponseFactory.success('Test type removed successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
