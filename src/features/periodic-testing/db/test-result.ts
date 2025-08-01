import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertTestResult, TestResultTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

export interface PlayerTestResult {
  result_id: string;
  user_id: string;
  player_name: string;
  tests: Record<string, string>;
}

export interface TestResult {
  headers: Array<{ name: string; unit: string }>;
  players: Array<PlayerTestResult>;
}

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

export async function getTestResultByUserAndTypeIds(
  user_id: string,
  type_id: string
) {
  try {
    return await db.query.TestResultTable.findFirst({
      where: and(
        eq(TestResultTable.user_id, user_id),
        eq(TestResultTable.type_id, type_id)
      ),
    });
  } catch (error) {
    return null;
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
    return results.map(updateTestResultById);
  } catch (error) {
    throw error;
  }
}
