'use server';

import { revalidatePath } from 'next/cache';

import { Response, ResponseFactory } from '@/utils/response';

import {
  getDates,
  getTestResultByDate,
  insertTestResult,
} from '../db/test-result';

export async function getTestDates() {
  return getDates();
}

export async function getTestResult(date: string) {
  return await getTestResultByDate(date);
}

export async function createTestResult(
  user_id: string,
  type_id: string,
  result: string,
  date: string
): Promise<Response> {
  try {
    await insertTestResult({
      user_id,
      type_id,
      result,
      date,
    });

    revalidatePath('/periodic-testing');

    return ResponseFactory.success('Test result created successfully');
  } catch (error) {
    return ResponseFactory.fromError(error as Error);
  }
}
