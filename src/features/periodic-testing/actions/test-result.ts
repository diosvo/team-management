'use server';

import { revalidatePath } from 'next/cache';

import { InsertTestResult } from '@/drizzle/schema';
import { Response, ResponseFactory } from '@/utils/response';

import {
  getDates,
  getTestResultByDate,
  getTestResultByUserAndTypeIds,
  insertTestResult,
  updateTestResultById as updateAction,
  updateTestResults,
} from '../db/test-result';

export async function getTestDates() {
  return getDates();
}

export async function getTestResult(date: string) {
  if (!date) {
    return { headers: [], players: [] };
  }

  return await getTestResultByDate(date);
}

export async function createTestResult(
  results: Array<InsertTestResult>
): Promise<Response> {
  const toCreate: Array<InsertTestResult> = [];
  const toUpdate: Array<InsertTestResult> = [];

  try {
    // Check each result to see if it already exists
    for (const result of results) {
      const existing = await getTestResultByUserAndTypeIds(result);

      if (existing) {
        toUpdate.push({ ...result, result_id: existing.result_id });
      } else {
        toCreate.push(result);
      }
    }

    // Perform batch operations
    if (toCreate.length > 0) await insertTestResult(toCreate);
    if (toUpdate.length > 0) await updateTestResults(toUpdate);

    return ResponseFactory.success(
      `${toCreate.length} created, ${toUpdate.length} updated`
    );
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}

export async function updateTestResultById(
  result: Partial<InsertTestResult>
): Promise<Response> {
  try {
    await updateAction(result);

    revalidatePath('/periodic-testing');

    return ResponseFactory.success('Test result updated successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
