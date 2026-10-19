import { MatchStatus } from '@/utils/enum';

import { UpsertMatchSchema } from './match';

describe('UpsertMatchSchema', () => {
  const MATCH = {
    location_id: null,
    date: '2026-01-15',
    time: '19:00:00',
    away_team: '11111111-1111-4111-8111-111111111111',
  };

  test('defaults a new match to scheduled with no score', () => {
    expect(UpsertMatchSchema.parse(MATCH)).toMatchObject({
      status: MatchStatus.SCHEDULED,
      home_team_score: 0,
      away_team_score: 0,
    });
  });

  test('accepts a score on a completed match', () => {
    const result = UpsertMatchSchema.safeParse({
      ...MATCH,
      status: MatchStatus.COMPLETED,
      home_team_score: 72,
      away_team_score: 65,
    });

    expect(result.success).toBe(true);
  });

  test('accepts a completed 0-0 match as a real draw', () => {
    const result = UpsertMatchSchema.safeParse({
      ...MATCH,
      status: MatchStatus.COMPLETED,
    });

    expect(result.success).toBe(true);
  });

  test.each([MatchStatus.SCHEDULED, MatchStatus.CANCELLED])(
    'rejects a score on a %s match, on the status field',
    (status) => {
      const result = UpsertMatchSchema.safeParse({
        ...MATCH,
        status,
        home_team_score: 0,
        away_team_score: 3,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({
          path: ['status'],
          message: 'Only a completed match can carry a score',
        }),
      ]);
    },
  );

  test('rejects an unknown status', () => {
    const result = UpsertMatchSchema.safeParse({ ...MATCH, status: 'live' });

    expect(result.success).toBe(false);
  });
});
