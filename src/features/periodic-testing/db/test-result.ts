import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { InsertTestResult, TestResultTable } from '@/drizzle/schema';
import logger from '@/lib/logger';

export async function getTestResultByDate(date: string) {
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

    return results;
  } catch (error) {
    logger.error('Error fetching test results:', error);
    return [];
  }
}

export async function insertTestResult(data: InsertTestResult) {
  try {
    const [result] = await db.insert(TestResultTable).values(data).returning();

    return result;
  } catch (error) {
    console.error('Error inserting test result:', error);
    throw error;
  }
}
