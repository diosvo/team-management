import { asc, eq } from 'drizzle-orm';
import { groupBy } from 'es-toolkit/array';

import db from '@/drizzle';
import {
  type TestType,
  TestNoteTable,
  TestResultTable,
  TestTypeTable,
  UserTable,
} from '@/drizzle/schema';

import type {
  PlayerProgressionDetail,
  PlayerTypeProgression,
  TestNoteItem,
  TypeProgression,
} from '@/types/periodic-testing';
import {
  average,
  goalOutcome,
  isBetter,
  summarize,
  toNumber,
} from '@/utils/progression';

type HistoryRow = {
  player_id: string;
  player_name: string;
  type_id: string;
  result: number;
  date: string;
};

async function getTeamTestTypes(team_id: string): Promise<Array<TestType>> {
  return await db.query.TestTypeTable.findMany({
    where: eq(TestTypeTable.team_id, team_id),
    orderBy: [asc(TestTypeTable.name)],
  });
}

/** Every result recorded against the team's test types, oldest first. */
async function getTeamHistory(team_id: string): Promise<Array<HistoryRow>> {
  const rows = await db
    .select({
      player_id: TestResultTable.player_id,
      player_name: UserTable.name,
      type_id: TestResultTable.type_id,
      result: TestResultTable.result,
      date: TestResultTable.date,
    })
    .from(TestResultTable)
    .innerJoin(
      TestTypeTable,
      eq(TestTypeTable.type_id, TestResultTable.type_id),
    )
    .innerJoin(UserTable, eq(UserTable.id, TestResultTable.player_id))
    .where(eq(TestTypeTable.team_id, team_id))
    .orderBy(asc(TestResultTable.date));

  return rows.map((row) => ({ ...row, result: Number(row.result) }));
}

function buildTypeProgression(
  type: TestType,
  rows: Array<HistoryRow>,
): TypeProgression {
  const target = toNumber(type.target);
  const latest_date = rows.at(-1)?.date ?? null;

  const players = Object.values(groupBy(rows, (row) => row.player_id)).map(
    (history) => {
      const { player_id, player_name } = history[0];
      return {
        player_id,
        player_name,
        ...summarize(history, type.higher_is_better, target),
        missed_latest: history.at(-1)?.date !== latest_date,
      };
    },
  );

  const latestResults = players.map(({ latest }) => latest.result);

  return {
    type,
    latest_date,
    team_average: average(latestResults),
    team_best: latestResults.length
      ? latestResults.reduce((top, value) =>
          isBetter(value, top, type.higher_is_better) ? value : top,
        )
      : null,
    players,
  };
}

/**
 * Progression of every tested player for one test type. Falls back to the
 * first type that has results when `type_id` is empty or not on the team.
 */
export async function getTeamProgression(
  team_id: string,
  type_id: string,
): Promise<{
  types: Array<TestType>;
  progression: Nullable<TypeProgression>;
}> {
  try {
    const [types, rows] = await Promise.all([
      getTeamTestTypes(team_id),
      getTeamHistory(team_id),
    ]);

    const type =
      types.find((item) => item.type_id === type_id) ??
      types.find((item) => rows.some((row) => row.type_id === item.type_id)) ??
      types[0];

    if (!type) return { types, progression: null };

    return {
      types,
      progression: buildTypeProgression(
        type,
        rows.filter((row) => row.type_id === type.type_id),
      ),
    };
  } catch {
    return { types: [], progression: null };
  }
}

async function getPlayerNotes(player_id: string): Promise<Array<TestNoteItem>> {
  const notes = await db.query.TestNoteTable.findMany({
    where: eq(TestNoteTable.player_id, player_id),
    with: {
      type: { columns: { name: true, unit: true } },
      author: { columns: { name: true } },
    },
    orderBy: (note, { desc }) => [desc(note.created_at)],
  });

  return notes.map(
    ({ note_id, content, goal, type_id, type, author, created_at }) => ({
      note_id,
      content,
      goal: toNumber(goal),
      type_id,
      type_name: type?.name ?? null,
      unit: type?.unit ?? null,
      author_name: author?.name ?? null,
      created_at,
      outcome: null,
    }),
  );
}

/** A player's timeline per test type, with the team average on each test date. */
export async function getPlayerProgression(
  team_id: string,
  player_id: string,
): Promise<Nullable<PlayerProgressionDetail>> {
  const user = await db.query.UserTable.findFirst({
    columns: { id: true, name: true, team_id: true },
    where: eq(UserTable.id, player_id),
  });

  if (!user) return null;

  const [types, rows, notes] = await Promise.all([
    getTeamTestTypes(team_id),
    getTeamHistory(team_id),
    getPlayerNotes(player_id),
  ]);

  // Ensure the player is either currently on the team or has been tested by the team.
  const tested = rows.some((row) => row.player_id === player_id);
  if (user.team_id !== team_id && !tested) return null;

  const playerRows = rows.filter((row) => row.player_id === player_id);

  // A goal is judged by the first result recorded after the note was written.
  const judged = notes.map((note) => {
    const type = types.find(({ type_id }) => type_id === note.type_id);
    if (note.goal == null || !type) return note;

    const written = note.created_at.toISOString().slice(0, 10);
    const next = playerRows.find(
      (row) => row.type_id === type.type_id && row.date > written,
    );
    return {
      ...note,
      outcome: goalOutcome(note.goal, next?.result, type.higher_is_better),
    };
  });

  const progressions: Array<PlayerTypeProgression> = types.flatMap((type) => {
    const typeRows = rows.filter((row) => row.type_id === type.type_id);
    const history = typeRows.filter((row) => row.player_id === player_id);
    if (history.length === 0) return [];

    // Notes are newest first, so this is the current goal.
    const goal =
      notes.find((note) => note.type_id === type.type_id && note.goal != null)
        ?.goal ?? null;

    const byDate = groupBy(typeRows, (row) => row.date);
    const summary = summarize(
      history,
      type.higher_is_better,
      toNumber(type.target),
    );

    return [
      {
        type,
        goal,
        ...summary,
        history: history.map(({ date, result }) => ({
          date,
          result,
          // The date's rows include this player's own result, so never empty.
          team_average: average(byDate[date].map((row) => row.result))!,
        })),
      },
    ];
  });

  return {
    player_id: user.id,
    player_name: user.name,
    types: progressions,
    notes: judged,
    test_types: types,
  };
}
