import { desc, eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertTestResult, TestResultTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

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

    // Group by player
    const players = Object.values(
      results.reduce((acc, result) => {
        const { user_id, user, result_id, type } = result;

        acc[user_id] ??= {
          user_id,
          player_name: user.name,
          tests: {},
          result_id,
        };

        acc[user_id].tests[type.name] = result.result;
        return acc;
      }, {} as Record<string, any>)
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

export async function insertTestResult(data: InsertTestResult) {
  try {
    return await db.insert(TestResultTable).values(data).returning();
  } catch (error) {
    throw error;
  }
}
