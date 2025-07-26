'use server';

import { TestTypeUnit } from '@/utils/enum';
import { Response, ResponseFactory } from '@/utils/response';

import {
  deleteTestType,
  getTestTypes as getAction,
  getTestTypeById,
  insertTestType,
  updateTestType,
} from '../db/test-type';

export async function getTestTypes() {
  return await getAction();
}

export async function upsertTestType(
  type_id: string,
  data: { name: string; unit: TestTypeUnit }
): Promise<Response> {
  try {
    const existingTestType = await getTestTypeById(type_id);

    if (existingTestType) {
      await updateTestType(existingTestType.type_id, data);
    } else {
      await insertTestType(data);
    }

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

    // revalidateRulePath();

    return ResponseFactory.success('Test type removed successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
