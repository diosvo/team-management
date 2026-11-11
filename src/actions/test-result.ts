'use server';

import { getTranslations } from 'next-intl/server';

import { ResponseFactory } from '@/utils/response';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTestResultById,
  insertTestResult,
  selectDates,
  selectExistingTestResults,
  selectTestResultByDate,
  testResultKey,
  updateTestResultById,
  updateTestResults,
} from '@/db/test-result';
import type { InsertTestResult } from '@/drizzle/schema';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const periodicTesting = withResource('periodic-testing');

export const canCreateTestResult = periodicTesting(
  ['create'],
  async function canUpsert() {
    return true;
  },
);

export const getTestDates = withAuth(selectDates);

export const getTestResult = withAuth(async (_: unknown, date: string) => {
  if (!date) {
    return { headers: [], players: [] };
  }

  return await selectTestResultByDate(date);
});

export const createTestResult = periodicTesting(
  ['create'],
  async function create(_, results: Array<InsertTestResult>) {
    const t = await getTranslations('actions.testResult');
    const toCreate: Array<InsertTestResult> = [];
    const toUpdate: Array<InsertTestResult> = [];

    try {
      const existings = await selectExistingTestResults(results);

      results.forEach((result) => {
        const result_id = existings.get(testResultKey(result));

        if (result_id) {
          toUpdate.push({ ...result, result_id });
        } else {
          toCreate.push(result);
        }
      });

      // Perform batch operations
      if (toCreate.length > 0) await insertTestResult(toCreate);
      if (toUpdate.length > 0) await updateTestResults(toUpdate);

      revalidate.testResults();

      return ResponseFactory.success(
        t('saved', { created: toCreate.length, updated: toUpdate.length }),
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const updateTestResult = periodicTesting(
  ['edit'],
  async function updateById(_, result: Partial<InsertTestResult>) {
    const t = await getTranslations('actions.testResult');
    try {
      await updateTestResultById(result);

      revalidate.testResults();

      return ResponseFactory.success(t('updated'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeTestResult = periodicTesting(
  ['delete'],
  async function deleteById(_, result_id: string) {
    const t = await getTranslations('actions.testResult');
    try {
      await deleteTestResultById(result_id);

      revalidate.testResults();

      return ResponseFactory.success(t('deleted'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
