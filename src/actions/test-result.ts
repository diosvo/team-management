'use server';

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

import { ResponseFactory } from '@/utils/response';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const periodicTesting = withResource('periodic-testing');

export const canCreateTestResult = periodicTesting(
  ['create'],
  async function canUpsert() {
    return true;
  },
);

export const getTestDates = withAuth(getDates);

export const getTestResult = withAuth(async (_: unknown, date: string) => {
  if (!date) {
    return { headers: [], players: [] };
  }

  return await getTestResultByDate(date);
});

export const createTestResult = periodicTesting(
  ['create'],
  async function create(_, results: Array<InsertTestResult>) {
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

export const updateTestResultById = periodicTesting(
  ['edit'],
  async function updateById(_, result: Partial<InsertTestResult>) {
    try {
      await updateAction(result);

      revalidate.testResults();

      return ResponseFactory.success('Test result updated successfully');
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
