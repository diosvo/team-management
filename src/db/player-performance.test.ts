import { MOCK_PERFORMANCE_RANGE } from '@/test/mocks/performance';

import db from '@/drizzle';
import {
  AchievementType,
  ActivityKind,
  AttendanceStatus,
  MatchResult,
  TestTypeUnit,
} from '@/utils/enum';

import {
  getPlayerActivity,
  getPlayerAttendanceOverview,
  getPlayerHonorSummary,
  getPlayerMatchesOverview,
  getPlayerTestingOverview,
  getPlayerTestingSummary,
} from './player-performance';

vi.mock('@/drizzle', () => ({
  default: {
    select: vi.fn(),
  },
}));

/**
 * A query builder stand-in: every chained call returns itself and awaiting it
 * settles with `result` (or rejects when it is an `Error`).
 */
function chain(result: unknown) {
  const promise =
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  promise.catch(() => {});

  const builder: object = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'then') return promise.then.bind(promise);
        if (prop === 'catch') return promise.catch.bind(promise);
        return () => builder;
      },
    },
  );
  return builder;
}

/** Each `db.select()` resolves with the next value, in call order. */
function queueSelects(...results: Array<unknown>) {
  vi.mocked(db.select).mockImplementation(
    () => chain(results.shift()) as unknown as ReturnType<typeof db.select>,
  );
}

const PLAYER_ID = 'player-1';
const TEAM_ID = 'team-1';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-30T12:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getPlayerAttendanceOverview', () => {
  test('summarizes rates, streaks, months, reasons and the trend', async () => {
    queueSelects(
      [
        { date: '2026-05-03', status: AttendanceStatus.ON_TIME, reason: null },
        { date: '2026-05-10', status: AttendanceStatus.LATE, reason: ' Rain ' },
        { date: '2026-05-12', status: AttendanceStatus.ABSENT, reason: 'Sick' },
        { date: '2026-06-01', status: AttendanceStatus.ABSENT, reason: null },
        { date: '2026-06-05', status: AttendanceStatus.ON_TIME, reason: null },
        { date: '2026-06-06', status: AttendanceStatus.LATE, reason: 'Rain' },
      ],
      [
        { month: '2026-05', total: 10, attended: 8, rate: 80 },
        { month: '2026-04', total: 5, attended: 5, rate: 100 },
      ],
      [
        { date: '2026-05-20', status: AttendanceStatus.ABSENT },
        { date: '2026-06-10', status: AttendanceStatus.ON_TIME },
        { date: '2026-06-11', status: AttendanceStatus.LATE },
      ],
    );

    const result = await getPlayerAttendanceOverview(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(db.select).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      total: 6,
      on_time: 2,
      late: 2,
      absent: 2,
      rate: 66.7,
      team_rate: 86.7,
      current_streak: 2,
      best_streak: 2,
      trend: { recent: 100, previous: 0, delta: 100 },
      monthly: [
        { month: '2026-04', player: null, team: 100 },
        { month: '2026-05', player: 66.7, team: 80 },
        { month: '2026-06', player: 66.7, team: null },
      ],
      reasons: [
        { name: 'Rain', count: 2 },
        { name: 'Sick', count: 1 },
        { name: null, count: 1 },
      ],
    });
  });

  test('returns zeroed rates and no trend without any rows', async () => {
    queueSelects([], [], []);

    const result = await getPlayerAttendanceOverview(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(result).toEqual({
      total: 0,
      on_time: 0,
      late: 0,
      absent: 0,
      rate: 0,
      team_rate: 0,
      current_streak: 0,
      best_streak: 0,
      trend: null,
      monthly: [],
      reasons: [],
    });
  });

  test('has no trend when the previous window is empty', async () => {
    queueSelects(
      [],
      [],
      [{ date: '2026-06-20', status: AttendanceStatus.ON_TIME }],
    );

    const result = await getPlayerAttendanceOverview(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(result.trend).toBeNull();
  });

  test('falls back to the empty overview on a database error', async () => {
    queueSelects(new Error('boom'), [], []);

    const result = await getPlayerAttendanceOverview(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(result).toMatchObject({ total: 0, trend: null, monthly: [] });
  });
});

describe('getPlayerTestingOverview', () => {
  test('returns the empty overview when the player has no results', async () => {
    queueSelects([]);

    const result = await getPlayerTestingOverview(PLAYER_ID, TEAM_ID);

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ types: [], tests_taken: 0, last_tested: null });
  });

  test('builds per-type progress against the team', async () => {
    queueSelects(
      [
        {
          type_id: 't1',
          name: 'Sprint',
          unit: TestTypeUnit.SECONDS,
          date: '2026-01-10',
          result: '5.0',
        },
        {
          type_id: 't3',
          name: 'Zero',
          unit: TestTypeUnit.POINTS,
          date: '2026-01-10',
          result: '0',
        },
        {
          type_id: 't4',
          name: 'Vertical',
          unit: TestTypeUnit.POINTS,
          date: '2026-01-10',
          result: '10',
        },
        {
          type_id: 't1',
          name: 'Sprint',
          unit: TestTypeUnit.SECONDS,
          date: '2026-03-10',
          result: '4.5',
        },
        {
          type_id: 't2',
          name: 'Jump',
          unit: TestTypeUnit.METERS,
          date: '2026-03-10',
          result: '2.0',
        },
        {
          type_id: 't3',
          name: 'Zero',
          unit: TestTypeUnit.POINTS,
          date: '2026-03-10',
          result: '5',
        },
        {
          type_id: 't4',
          name: 'Vertical',
          unit: TestTypeUnit.POINTS,
          date: '2026-03-10',
          result: '12',
        },
      ],
      [
        {
          type_id: 't1',
          date: '2026-01-10',
          player_id: PLAYER_ID,
          result: '5.0',
        },
        { type_id: 't1', date: '2026-01-10', player_id: 'p2', result: '6.0' },
        {
          type_id: 't1',
          date: '2026-03-10',
          player_id: PLAYER_ID,
          result: '4.5',
        },
        { type_id: 't1', date: '2026-03-10', player_id: 'p2', result: '4.0' },
        { type_id: 't1', date: '2026-03-10', player_id: 'p3', result: '5.0' },
        {
          type_id: 't2',
          date: '2026-03-10',
          player_id: PLAYER_ID,
          result: '2.0',
        },
        { type_id: 't2', date: '2026-03-10', player_id: 'p2', result: '1.5' },
      ],
    );

    const result = await getPlayerTestingOverview(PLAYER_ID, TEAM_ID);

    expect(result.tests_taken).toBe(2);
    expect(result.last_tested).toBe('2026-03-10');
    expect(result.types.map(({ name }) => name)).toEqual([
      'Jump',
      'Sprint',
      'Vertical',
      'Zero',
    ]);

    const [jump, sprint, vertical, zero] = result.types;

    // Higher is better: a rise reads as a positive change.
    expect(vertical.latest.improvement_pct).toBe(20);

    expect(jump).toEqual({
      type_id: 't2',
      name: 'Jump',
      unit: TestTypeUnit.METERS,
      lower_is_better: false,
      latest: {
        date: '2026-03-10',
        result: 2,
        improvement_pct: null,
        team_avg: 1.8,
        percentile: 100,
      },
      series: [{ date: '2026-03-10', result: 2, team_avg: 1.8 }],
    });

    expect(sprint).toEqual({
      type_id: 't1',
      name: 'Sprint',
      unit: TestTypeUnit.SECONDS,
      lower_is_better: true,
      latest: {
        date: '2026-03-10',
        result: 4.5,
        improvement_pct: 10,
        team_avg: 4.5,
        percentile: 50,
      },
      series: [
        { date: '2026-01-10', result: 5, team_avg: 5.5 },
        { date: '2026-03-10', result: 4.5, team_avg: 4.5 },
      ],
    });

    // No team rows and a zero baseline: nothing to compare against.
    expect(zero.latest).toEqual({
      date: '2026-03-10',
      result: 5,
      improvement_pct: null,
      team_avg: null,
      percentile: null,
    });
  });

  test('falls back to the empty overview on a database error', async () => {
    queueSelects(new Error('boom'));

    const result = await getPlayerTestingOverview(PLAYER_ID, TEAM_ID);

    expect(result).toEqual({ types: [], tests_taken: 0, last_tested: null });
  });
});

const MATCH_ROWS = [
  {
    match_id: 'm1',
    date: '2026-03-01',
    home_team_score: 50,
    away_team_score: 40,
    opponent: 'Alpha',
    points_scored: 10,
    rebounds: 5,
    assists: 3,
    steals: null,
    blocks: null,
    turnovers: null,
    fouls: null,
  },
  {
    match_id: 'm2',
    date: '2026-04-01',
    home_team_score: 30,
    away_team_score: 40,
    opponent: 'Beta',
    points_scored: 20,
    rebounds: 7,
    assists: 1,
    steals: 2,
    blocks: 1,
    turnovers: 3,
    fouls: 4,
  },
  {
    match_id: 'm3',
    date: '2026-05-01',
    home_team_score: 40,
    away_team_score: 40,
    opponent: 'Gamma',
    points_scored: 5,
    rebounds: 2,
    assists: 2,
    steals: 1,
    blocks: 0,
    turnovers: 1,
    fouls: 2,
  },
];

describe('getPlayerMatchesOverview', () => {
  test('maps results and averages the box scores', async () => {
    queueSelects(MATCH_ROWS);

    const result = await getPlayerMatchesOverview(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(result.records).toEqual([
      expect.objectContaining({
        match_id: 'm1',
        score: '50 - 40',
        result: MatchResult.WIN,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
      }),
      expect.objectContaining({
        match_id: 'm2',
        score: '30 - 40',
        result: MatchResult.LOSS,
        steals: 2,
      }),
      expect.objectContaining({
        match_id: 'm3',
        score: '40 - 40',
        result: MatchResult.DRAW,
      }),
    ]);
    expect(result.records[0]).not.toHaveProperty('home_team_score');
    expect(result.averages).toEqual({
      points_scored: 11.7,
      rebounds: 4.7,
      assists: 2,
      steals: 1,
      blocks: 0.3,
      turnovers: 1.3,
    });
  });

  test.each([
    ['no matches were played', []],
    ['the query fails', new Error('boom')],
  ])('returns the empty overview when %s', async (_, rows) => {
    queueSelects(rows);

    const result = await getPlayerMatchesOverview(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(result).toEqual({
      records: [],
      averages: {
        points_scored: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
      },
    });
  });
});

describe('getPlayerActivity', () => {
  test('merges sessions, tests and matches newest first', async () => {
    queueSelects(
      [
        {
          session_id: 's1',
          date: '2026-02-01',
          start_time: '08:00',
          end_time: '09:30',
          location: 'Gym',
          status: AttendanceStatus.ON_TIME,
          reason: null,
        },
        {
          session_id: 's2',
          date: '2026-02-05',
          start_time: '10:00',
          end_time: '09:00',
          location: null,
          status: null,
          reason: null,
        },
        {
          session_id: 's3',
          date: '2026-02-07',
          start_time: 'bad',
          end_time: 'bad',
          location: 'Court',
          status: AttendanceStatus.ABSENT,
          reason: 'Sick',
        },
      ],
      [
        { date: '2026-03-10', name: 'Jump', unit: 'meters', result: '2.0' },
        { date: '2026-03-10', name: 'Sprint', unit: 'seconds', result: '4.5' },
        { date: '2026-01-10', name: 'Sprint', unit: 'seconds', result: '5.0' },
      ],
      [MATCH_ROWS[0]],
    );

    const result = await getPlayerActivity(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(result).toEqual(
      [
        {
          id: 'm1',
          date: '2026-03-01',
          kind: ActivityKind.MATCH,
          opponent: 'Alpha',
          result: MatchResult.WIN,
          score: '50 - 40',
          points_scored: 10,
          rebounds: 5,
          assists: 3,
        },
        {
          id: 'test-2026-03-10',
          date: '2026-03-10',
          kind: ActivityKind.TEST,
          results: [
            { name: 'Jump', result: 2, unit: 'meters' },
            { name: 'Sprint', result: 4.5, unit: 'seconds' },
          ],
        },
        {
          id: 's3',
          date: '2026-02-07',
          kind: ActivityKind.TRAINING,
          location: 'Court',
          duration_hours: null,
          status: AttendanceStatus.ABSENT,
          reason: 'Sick',
        },
        {
          id: 's2',
          date: '2026-02-05',
          kind: ActivityKind.TRAINING,
          location: null,
          duration_hours: null,
          status: null,
          reason: null,
        },
        {
          id: 's1',
          date: '2026-02-01',
          kind: ActivityKind.TRAINING,
          location: 'Gym',
          duration_hours: 1.5,
          status: AttendanceStatus.ON_TIME,
          reason: null,
        },
        {
          id: 'test-2026-01-10',
          date: '2026-01-10',
          kind: ActivityKind.TEST,
          results: [{ name: 'Sprint', result: 5, unit: 'seconds' }],
        },
      ].sort((a, b) => b.date.localeCompare(a.date)),
    );
  });

  test('keeps a range that ends before today', async () => {
    queueSelects([], [], []);

    const result = await getPlayerActivity(PLAYER_ID, TEAM_ID, {
      from: '2026-01-01',
      to: '2026-02-01',
    });

    expect(result).toEqual([]);
  });

  test('returns an empty log on a database error', async () => {
    queueSelects(new Error('boom'), [], []);

    const result = await getPlayerActivity(
      PLAYER_ID,
      TEAM_ID,
      MOCK_PERFORMANCE_RANGE,
    );

    expect(result).toEqual([]);
  });
});

describe('getPlayerHonorSummary', () => {
  test('counts the honors and keeps the newest', async () => {
    queueSelects([{ type: AchievementType.MVP, year: 2026, count: 3 }]);

    await expect(getPlayerHonorSummary(PLAYER_ID)).resolves.toEqual({
      count: 3,
      latest: { type: AchievementType.MVP, year: 2026 },
    });
  });

  test.each([
    ['the player has no honors', []],
    ['the query fails', new Error('boom')],
  ])('returns no honors when %s', async (_, rows) => {
    queueSelects(rows);

    await expect(getPlayerHonorSummary(PLAYER_ID)).resolves.toEqual({
      count: 0,
      latest: null,
    });
  });
});

describe('getPlayerTestingSummary', () => {
  test('counts the distinct testing days', async () => {
    queueSelects([{ tests_taken: 2, last_tested: '2026-03-10' }]);

    await expect(getPlayerTestingSummary(PLAYER_ID)).resolves.toEqual({
      tests_taken: 2,
      last_tested: '2026-03-10',
    });
  });

  test.each([
    ['no row comes back', []],
    ['the query fails', new Error('boom')],
  ])('returns no tests when %s', async (_, rows) => {
    queueSelects(rows);

    await expect(getPlayerTestingSummary(PLAYER_ID)).resolves.toEqual({
      tests_taken: 0,
      last_tested: null,
    });
  });
});
