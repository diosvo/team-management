import { AchievementType } from '@/utils/enum';

import { UpsertAchievementSchema } from './achievement';

const base = {
  type: AchievementType.CHAMPION,
  year: new Date().getFullYear(),
  league_id: null,
  player_id: null,
  description: null,
};

describe('UpsertAchievementSchema title', () => {
  test.each([undefined, null, '', '   '])(
    'stores a blank title (%j) as null for a typed honor',
    (title) => {
      const result = UpsertAchievementSchema.safeParse({ ...base, title });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBeNull();
    },
  );

  test('trims a custom title', () => {
    const result = UpsertAchievementSchema.safeParse({
      ...base,
      title: '  Summer Champions  ',
    });

    expect(result.data?.title).toBe('Summer Champions');
  });

  test('requires a title for a custom honor', () => {
    const result = UpsertAchievementSchema.safeParse({
      ...base,
      type: AchievementType.CUSTOM,
      title: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        message: 'customTitleRequired',
        path: ['title'],
      }),
    ]);
  });

  test('accepts a custom honor with a title', () => {
    const result = UpsertAchievementSchema.safeParse({
      ...base,
      type: AchievementType.CUSTOM,
      title: 'Fair Play Award',
    });

    expect(result.success).toBe(true);
  });
});
