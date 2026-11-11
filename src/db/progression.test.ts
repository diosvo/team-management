import { ProgressStatus } from '@/utils/enum';

import db from '@/drizzle';
import type { TestType } from '@/drizzle/schema';
import {
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
} from '@/test/mocks/periodic-testing';
import {
  MOCK_GENERAL_NOTE,
  MOCK_PLAYER_PROGRESSION,
  MOCK_PLAYER_PROGRESSION_2,
  MOCK_TEST_NOTE,
} from '@/test/mocks/progression';
import { MOCK_TEAM } from '@/test/mocks/team';

import {
  isPlayerInTeamScope,
  selectPlayerProgression,
  selectTeamProgression,
} from './progression';

const orderBy = vi.fn();
const limit = vi.fn();

vi.mock('@/drizzle', () => {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: (...args: Array<unknown>) => orderBy(...args),
    limit: (...args: Array<unknown>) => limit(...args),
  };
  return {
    default: {
      query: {
        TestTypeTable: { findMany: vi.fn() },
        TestNoteTable: { findMany: vi.fn() },
        UserTable: { findFirst: vi.fn() },
      },
      select: vi.fn(() => chain),
    },
  };
});

const TEAM = MOCK_TEAM.team_id;
const P1 = MOCK_PLAYER_PROGRESSION.player_id;
const P2 = MOCK_PLAYER_PROGRESSION_2.player_id;
// Sprint (seconds, lower is better) with a target; push-ups without one.
const SPRINT: TestType = {
  ...MOCK_TEST_TYPE,
  higher_is_better: false,
  target: '5',
};
const PUSH_UPS: TestType = MOCK_TEST_TYPE_2;

const row = (
  player_id: string,
  type_id: string,
  result: string,
  date: string,
) => ({ player_id, player_name: `Name ${player_id}`, type_id, result, date });

const ROWS = [
  row(P1, SPRINT.type_id, '6', '2026-01-01'),
  row(P2, SPRINT.type_id, '5.5', '2026-01-01'),
  row(P1, SPRINT.type_id, '5', '2026-02-01'),
];

const mockTypes = (types: Array<TestType>) =>
  vi.mocked(db.query.TestTypeTable.findMany).mockResolvedValue(types);

beforeEach(() => {
  vi.clearAllMocks();
  orderBy.mockResolvedValue(ROWS);
});

describe('selectTeamProgression', () => {
  test('builds the requested type with team average, best and missed flags', async () => {
    mockTypes([PUSH_UPS, SPRINT]);

    const { types, progression } = await selectTeamProgression(
      TEAM,
      SPRINT.type_id,
    );

    expect(types).toEqual([PUSH_UPS, SPRINT]);
    expect(progression?.type).toBe(SPRINT);
    expect(progression?.latest_date).toBe('2026-02-01');
    // Latest results: p1 = 5, p2 = 5.5 → best is the lower one.
    expect(progression?.team_average).toBe(5.25);
    expect(progression?.team_best).toBe(5);

    const [p1, p2] = progression!.players;
    expect(p1).toMatchObject({
      player_id: P1,
      player_name: `Name ${P1}`,
      status: ProgressStatus.IMPROVING,
      missed_latest: false,
    });
    expect(p2).toMatchObject({ player_id: P2, missed_latest: true });
  });

  test('picks the best latest result in either order', async () => {
    orderBy.mockResolvedValue([
      row(P1, PUSH_UPS.type_id, '30', '2026-01-01'),
      row(P2, PUSH_UPS.type_id, '20', '2026-01-01'),
      row('p3', PUSH_UPS.type_id, '40', '2026-01-01'),
    ]);
    mockTypes([PUSH_UPS]);

    const { progression } = await selectTeamProgression(TEAM, PUSH_UPS.type_id);

    expect(progression?.team_best).toBe(40);
  });

  test('falls back to the first type with results', async () => {
    mockTypes([PUSH_UPS, SPRINT]);

    const { progression } = await selectTeamProgression(TEAM, '');

    expect(progression?.type).toBe(SPRINT);
  });

  test('falls back to the first type when none has results', async () => {
    orderBy.mockResolvedValue([]);
    mockTypes([PUSH_UPS]);

    const { progression } = await selectTeamProgression(TEAM, '');

    expect(progression).toMatchObject({
      type: PUSH_UPS,
      latest_date: null,
      team_average: null,
      team_best: null,
      players: [],
    });
  });

  test('has no progression without types', async () => {
    mockTypes([]);

    await expect(selectTeamProgression(TEAM, '')).resolves.toEqual({
      types: [],
      progression: null,
    });
  });

  test('returns empty data when a query fails', async () => {
    vi.mocked(db.query.TestTypeTable.findMany).mockRejectedValue(
      new Error('boom'),
    );

    await expect(selectTeamProgression(TEAM, '')).resolves.toEqual({
      types: [],
      progression: null,
    });
  });
});

describe('selectPlayerProgression', () => {
  const mockUser = (team_id: string | null) =>
    vi
      .mocked(db.query.UserTable.findFirst)
      .mockResolvedValue(
        team_id === undefined
          ? undefined
          : ({ id: P1, name: `Name ${P1}`, team_id } as never),
      );

  beforeEach(() => {
    mockTypes([PUSH_UPS, SPRINT]);
    vi.mocked(db.query.TestNoteTable.findMany).mockResolvedValue([]);
  });

  test('is null for an unknown user', async () => {
    vi.mocked(db.query.UserTable.findFirst).mockResolvedValue(undefined);

    await expect(selectPlayerProgression(TEAM, P1)).resolves.toBeNull();
  });

  test('is null for a player of another team never tested here', async () => {
    mockUser('other-team');
    orderBy.mockResolvedValue([]);

    await expect(selectPlayerProgression(TEAM, P1)).resolves.toBeNull();
  });

  test('opens a moved player who was tested on this team', async () => {
    mockUser('other-team');

    const detail = await selectPlayerProgression(TEAM, P1);

    expect(detail?.player_id).toBe(P1);
  });

  test('builds per-type history against the team average', async () => {
    mockUser(TEAM);

    const detail = await selectPlayerProgression(TEAM, P1);

    expect(detail).toMatchObject({
      player_id: P1,
      player_name: `Name ${P1}`,
      notes: [],
      test_types: [PUSH_UPS, SPRINT],
    });
    // Push-ups has no results for p1, so only the sprint is tracked.
    expect(detail?.types).toHaveLength(1);
    expect(detail?.types[0]).toMatchObject({
      type: SPRINT,
      goal: null,
      count: 2,
      history: [
        { date: '2026-01-01', result: 6, team_average: 5.75 },
        { date: '2026-02-01', result: 5, team_average: 5 },
      ],
    });
  });

  test('maps notes with and without a type or author', async () => {
    mockUser(TEAM);
    const created_at = new Date('2026-03-01');
    vi.mocked(db.query.TestNoteTable.findMany).mockImplementation(((options: {
      orderBy: (note: object, ops: object) => unknown;
    }) => {
      options.orderBy(
        { created_at: 'created_at' },
        { desc: (v: unknown) => v },
      );
      return Promise.resolve([
        {
          note_id: MOCK_TEST_NOTE.note_id,
          content: MOCK_TEST_NOTE.content,
          goal: '4.8',
          type_id: SPRINT.type_id,
          type: { name: SPRINT.name, unit: SPRINT.unit },
          author: { name: MOCK_TEST_NOTE.author_name },
          created_at,
        },
        {
          note_id: MOCK_GENERAL_NOTE.note_id,
          content: MOCK_GENERAL_NOTE.content,
          goal: null,
          type_id: null,
          type: null,
          author: null,
          created_at,
        },
      ]);
    }) as never);

    const detail = await selectPlayerProgression(TEAM, P1);

    expect(detail?.notes).toEqual([
      {
        note_id: MOCK_TEST_NOTE.note_id,
        content: MOCK_TEST_NOTE.content,
        goal: 4.8,
        type_id: SPRINT.type_id,
        type_name: SPRINT.name,
        unit: SPRINT.unit,
        author_name: MOCK_TEST_NOTE.author_name,
        created_at,
        // Written after the latest sprint: awaiting the next test.
        outcome: 'pending',
      },
      {
        note_id: MOCK_GENERAL_NOTE.note_id,
        content: MOCK_GENERAL_NOTE.content,
        goal: null,
        type_id: null,
        type_name: null,
        unit: null,
        author_name: null,
        created_at,
        outcome: null,
      },
    ]);
    // The sprint note's goal is the type's current goal.
    expect(detail?.types[0]?.goal).toBe(4.8);
  });

  const mockNotes = (
    notes: Array<{ goal: Nullable<string>; type_id: string; written: string }>,
  ) =>
    vi.mocked(db.query.TestNoteTable.findMany).mockResolvedValue(
      notes.map(({ goal, type_id, written }, index) => ({
        note_id: `n${index}`,
        content: 'Note',
        goal,
        type_id,
        type: null,
        author: null,
        created_at: new Date(written),
      })) as never,
    );

  test.each([
    // Lower is better: the 5s result after the note beats 5.2 but not 4.8.
    ['5.2', 'met'],
    ['4.8', 'missed'],
  ])('judges a %s goal by the next result as %s', async (goal, outcome) => {
    mockUser(TEAM);
    mockNotes([{ goal, type_id: SPRINT.type_id, written: '2026-01-15' }]);

    const detail = await selectPlayerProgression(TEAM, P1);

    expect(detail?.notes[0]?.outcome).toBe(outcome);
  });

  test('leaves notes without a goal or on an unknown type unjudged', async () => {
    mockUser(TEAM);
    mockNotes([
      { goal: null, type_id: SPRINT.type_id, written: '2026-01-15' },
      { goal: '3', type_id: 'gone', written: '2026-01-15' },
    ]);

    const detail = await selectPlayerProgression(TEAM, P1);

    expect(detail?.notes.map(({ outcome }) => outcome)).toEqual([null, null]);
    expect(detail?.types[0]?.goal).toBeNull();
  });
});

describe('isPlayerInTeamScope', () => {
  const mockUser = (team_id: Nullable<string>) =>
    vi
      .mocked(db.query.UserTable.findFirst)
      .mockResolvedValue((team_id === null ? undefined : { team_id }) as never);

  test('rejects an unknown player', async () => {
    mockUser(null);

    await expect(isPlayerInTeamScope(TEAM, 'p9')).resolves.toBe(false);
    expect(db.select).not.toHaveBeenCalled();
  });

  test('accepts a player on the team without querying results', async () => {
    mockUser(TEAM);

    await expect(isPlayerInTeamScope(TEAM, P1)).resolves.toBe(true);
    expect(db.select).not.toHaveBeenCalled();
  });

  test('accepts a former player the team has tested', async () => {
    mockUser('team-2');
    limit.mockResolvedValue([{ player_id: P1 }]);

    await expect(isPlayerInTeamScope(TEAM, P1)).resolves.toBe(true);
    expect(limit).toHaveBeenCalledWith(1);
  });

  test('rejects a player from another team never tested', async () => {
    mockUser('team-2');
    limit.mockResolvedValue([]);

    await expect(isPlayerInTeamScope(TEAM, P1)).resolves.toBe(false);
  });
});
