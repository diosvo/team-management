'use server';

import { InsertTestResult } from '@/drizzle/schema';
import { Response, ResponseFactory } from '@/utils/response';

import {
  getDates,
  getTestResultByDate,
  getTestResultByUserAndTypeIds,
  insertTestResult,
  updateTestResult,
} from '../db/test-result';

export async function getTestDates() {
  return getDates();
}

export async function getTestResult(date: string) {
  return await getTestResultByDate(date);
}

export async function createTestResult(
  results: Array<InsertTestResult>
): Promise<Response> {
  try {
    const toCreate: Array<InsertTestResult> = [];
    const toUpdate: Array<InsertTestResult> = [];

    // Check each result to see if it already exists
    for (const result of results) {
      const existing = await getTestResultByUserAndTypeIds(
        result.user_id,
        result.type_id
      );

      if (existing) {
        toUpdate.push({ ...result, result_id: existing.result_id });
      } else {
        toCreate.push(result);
      }
    }

    // Perform batch operations
    if (toCreate.length > 0) {
      await insertTestResult(toCreate);
    }

    if (toUpdate.length > 0) {
      await updateTestResult(toUpdate);
    }

    return ResponseFactory.success(
      `${toCreate.length} created, ${toUpdate.length} updated`
    );
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
