import { and, desc, eq, inArray } from 'drizzle-orm';

import db from '@/drizzle';
import {
  type InsertTestResult,
  TestResultTable,
} from '@/drizzle/schema/periodic-testing';

import type { PlayerTestResult, TestResult } from '@/types/periodic-testing';

export async function getDates(): Promise<Array<string>> {
  try {
    const dates = await db
      .selectDistinct({ date: TestResultTable.date })
      .from(TestResultTable)
      .orderBy(desc(TestResultTable.date));

    return dates.map(({ date }) => date);
  } catch {
    return [];
  }
}

export async function getTestResultByDate(date: string): Promise<TestResult> {
  const types = new Map<string, { type_id: string; unit: string }>();

  try {
    const results = await db.query.TestResultTable.findMany({
      with: {
        player: {
          with: {
            user: true,
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
      const { type_id, name, unit } = type;
      if (!types.has(name)) types.set(name, { type_id, unit });
    });
    const headers = [...types].map(([name, { type_id, unit }]) => ({
      type_id,
      name,
      unit,
    }));

    const players: Array<PlayerTestResult> = Object.values(
      results.reduce(
        (acc, data) => {
          const { result_id, player_id, player, type, result } = data;

          acc[player_id] ??= {
            player_id,
            player_name: player.user.name,
            tests: {},
          };

          acc[player_id].tests[type.name] = { result_id, result };
          return acc;
        },
        {} as Record<string, PlayerTestResult>,
      ),
    );

    return {
      headers,
      players,
    };
  } catch (error) {
    return { headers: [], players: [] };
  }
}

/** Identity of a grid cell: one result per player, test type and date. */
export function testResultKey(result: {
  player_id: string;
  type_id: string;
  date?: Nullish<string>;
}): string {
  return `${result.date ?? ''}|${result.player_id}|${result.type_id}`;
}

/**
 * Resolves which of the submitted cells already exist, in a single query.
 * The grid submits players × test types rows, so one lookup per cell would
 * open hundreds of concurrent connections.
 *
 * @returns a map of {@link testResultKey} to the existing `result_id`
 */
export async function getExistingTestResults(
  results: Array<InsertTestResult>,
): Promise<Map<string, string>> {
  const existings = new Map<string, string>();
  if (results.length === 0) return existings;

  const player_ids = [...new Set(results.map(({ player_id }) => player_id))];
  const type_ids = [...new Set(results.map(({ type_id }) => type_id))];
  const dates = [...new Set(results.map(({ date }) => date))];

  const date_filter = dates.length
    ? inArray(TestResultTable.date, dates)
    : undefined;

  // The filters are a superset of the submitted cells (their cross product),
  // so match on the exact key below rather than trusting the rows returned.
  const rows = await db
    .select({
      result_id: TestResultTable.result_id,
      player_id: TestResultTable.player_id,
      type_id: TestResultTable.type_id,
      date: TestResultTable.date,
    })
    .from(TestResultTable)
    .where(
      and(
        inArray(TestResultTable.player_id, player_ids),
        inArray(TestResultTable.type_id, type_ids),
        date_filter,
      ),
    );

  const submitted = new Set(results.map(testResultKey));

  rows.forEach((row) => {
    const key = testResultKey(row);
    if (submitted.has(key)) existings.set(key, row.result_id);
  });

  return existings;
}

export async function insertTestResult(results: Array<InsertTestResult>) {
  return await db.insert(TestResultTable).values(results);
}

export async function updateTestResultById(result: Partial<InsertTestResult>) {
  return await db
    .update(TestResultTable)
    .set(result)
    .where(eq(TestResultTable.result_id, result.result_id as string));
}

export async function updateTestResults(results: Array<InsertTestResult>) {
  return await Promise.all(results.map(updateTestResultById));
}

export async function deleteTestResultById(result_id: string) {
  return await db
    .delete(TestResultTable)
    .where(eq(TestResultTable.result_id, result_id));
}
