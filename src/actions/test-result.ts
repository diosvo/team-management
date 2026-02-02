'use server';

import { revalidatePath } from 'next/cache';

import { InsertTestResult } from '@/drizzle/schema';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  getDates,
  getTestResultByDate,
  getTestResultByUserAndTypeIds,
  insertTestResult,
  updateTestResultById as updateAction,
  updateTestResults,
} from '@/db/test-result';

import { hasPermissions } from '@/utils/helper';
import { ResponseFactory } from '@/utils/response';
import { withAuth } from './auth';

export const canUpsertTestResult = withAuth(async (user) => {
  const { isAdmin } = hasPermissions(user.role);

  return isAdmin;
});

export const getTestDates = withAuth(async () => await getDates());

export const getTestResult = withAuth(async (_, date: string) => {
  if (!date) {
    return { headers: [], players: [] };
  }

  return await getTestResultByDate(date);
});

export const createTestResult = withAuth(
  async (_, results: Array<InsertTestResult>) => {
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
        `${toCreate.length} created, ${toUpdate.length} updated`,
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const updateTestResultById = withAuth(
  async (_, result: Partial<InsertTestResult>) => {
    try {
      await updateAction(result);

      revalidatePath('/periodic-testing');

      return ResponseFactory.success('Test result updated successfully');
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
