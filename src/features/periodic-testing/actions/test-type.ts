'use server';

import { getUsers } from '@/features/user/db/user';
import { TestTypeUnit, UserRole, UserState } from '@/utils/enum';
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

export async function createTestType(
  name: string,
  unit: TestTypeUnit
): Promise<Response> {
  try {
    await insertTestType({
      name,
      unit,
    });

    return ResponseFactory.success('Test type created successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function upsertTestType(
  type_id: string,
  name: string
): Promise<Response> {
  try {
    const existingTestType = await getTestTypeById(type_id);

    if (existingTestType) {
      await updateTestType(existingTestType.type_id, name);
    } else {
      await insertTestType({
        name,
        unit: TestTypeUnit.TIMES,
      });
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

/**
 * Server action to get user mappings (player name -> user_id)
 */
export async function getUserMappings(): Promise<{
  [playerName: string]: string;
}> {
  try {
    const users = await getUsers({
      query: '',
      role: [UserRole.PLAYER, UserRole.COACH],
      state: [UserState.ACTIVE, UserState.INACTIVE],
    });

    const mapping: { [playerName: string]: string } = {};

    if (users?.length) {
      for (const user of users) {
        if (user.name?.trim()) {
          mapping[user.name.trim()] = user.user_id;
        }
      }
    }

    return mapping;
  } catch (error) {
    console.error('Error getting user mappings:', error);
    return {};
  }
}

/**
 * Server action to get test type mappings (test type name -> type_id)
 */
export async function getTestTypeMappings(): Promise<{
  [testTypeName: string]: string;
}> {
  try {
    const testTypes = await getAction();
    const mapping: { [testTypeName: string]: string } = {};

    if (testTypes?.length) {
      for (const testType of testTypes) {
        if (testType.name?.trim()) {
          mapping[testType.name.trim()] = testType.type_id;
        }
      }
    }

    return mapping;
  } catch (error) {
    console.error('Error getting test type mappings:', error);
    return {};
  }
}

/**
 * Server action to get both user and test type mappings in one call
 */
export async function getAllMappings(): Promise<{
  users: { [playerName: string]: string };
  testTypes: { [testTypeName: string]: string };
}> {
  try {
    const [userMappings, testTypeMappings] = await Promise.all([
      getUserMappings(),
      getTestTypeMappings(),
    ]);

    return {
      users: userMappings,
      testTypes: testTypeMappings,
    };
  } catch (error) {
    console.error('Error getting all mappings:', error);
    return {
      users: {},
      testTypes: {},
    };
  }
}
