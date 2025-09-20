'server-only';

import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertTestResult, TestResultTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

import { PlayerTestResult } from '../schemas/models';

export async function getDates() {
  try {
    const dates = await db
      .selectDistinct({ date: TestResultTable.date })
      .from(TestResultTable)
      .orderBy(desc(TestResultTable.date));

    // Filter out null dates and cast to array string
    return dates
      .map(({ date }) => date)
      .filter((date): date is string => date != null);
  } catch {
    return [];
  }
}

export async function getTestResultByDate(date: string) {
  const types = new Map<string, string>();

  try {
    const results = await db.query.TestResultTable.findMany({
      with: {
        user: {
          columns: {
            name: true,
          },
        },
        type: {
          columns: {
            type_id: true,
            name: true,
            unit: true,
          },
        },
      },
      where: eq(TestResultTable.date, date),
    });

    // Build headers from the results
    results.forEach(({ type }) => {
      const { name, unit } = type;
      if (!types.has(name)) types.set(name, unit);
    });
    const headers = [...types].map(([name, unit]) => ({ name, unit }));

    const players: Array<PlayerTestResult> = Object.values(
      results.reduce((acc, data) => {
        const { result_id, user_id, user, type, result } = data;

        acc[user_id] ??= {
          user_id,
          player_name: user.name,
          tests: {},
          result_id,
        };

        acc[user_id].tests[type.name] = result;
        return acc;
      }, {} as Record<string, PlayerTestResult>)
    );

    return {
      headers,
      players,
    };
  } catch (error) {
    logger.error('Error fetching test results:', error);
    return { headers: [], players: [] };
  }
}

export async function getTestResultByUserAndTypeIds(result: InsertTestResult) {
  try {
    return await db.query.TestResultTable.findFirst({
      where: and(
        and(
          gte(TestResultTable.date, result.date!),
          lte(TestResultTable.date, result.date!)
        ),
        eq(TestResultTable.user_id, result.user_id),
        eq(TestResultTable.type_id, result.type_id)
      ),
    });
  } catch (error) {
    throw error;
  }
}

export async function insertTestResult(results: Array<InsertTestResult>) {
  try {
    return await db.insert(TestResultTable).values(results);
  } catch (error) {
    throw error;
  }
}

export async function updateTestResultById(result: Partial<InsertTestResult>) {
  try {
    return await db
      .update(TestResultTable)
      .set(result)
      .where(eq(TestResultTable.result_id, result.result_id as string));
  } catch (error) {
    throw error;
  }
}

export async function updateTestResults(results: Array<InsertTestResult>) {
  try {
    return await Promise.all(results.map(updateTestResultById));
  } catch (error) {
    throw error;
  }
}
