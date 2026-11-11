import { revalidatePath, revalidateTag } from 'next/cache';

import { CACHE_TAG } from '@/utils/constants';

import { MOCK_USER } from '@/test/mocks/user';

import { revalidate } from './cache';

describe('revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cached entities (revalidatePath + revalidateTag)', () => {
    test.each([
      ['leagues', '/leagues', CACHE_TAG.LEAGUES],
      ['locations', '/locations', CACHE_TAG.LOCATIONS],
      ['rule', '/team-rule', CACHE_TAG.RULE],
    ] as const)('revalidate %s() correctly', (method, path, _) => {
      revalidate[method]();

      expect(revalidatePath).toHaveBeenCalledWith(path);
      // expect(revalidateTag).toHaveBeenCalledWith(tag, 'max');
    });
  });

  describe('Non-cached entities (revalidatePath only)', () => {
    test.each([
      ['achievements', '/achievements'],
      ['assets', '/assets'],
      ['attendances', '/attendance'],
      ['matches', '/matches'],
      ['reports', '/reports'],
      ['roster', '/roster'],
      ['sessions', '/training'],
      ['teams', '/teams'],
    ] as const)('revalidate %s() correctly', (method, path) => {
      revalidate[method]();

      expect(revalidatePath).toHaveBeenCalledWith(path);
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    test.each(['testResults', 'testTypes'] as const)(
      '%s() revalidates the whole periodic-testing layout',
      (method) => {
        revalidate[method]();

        expect(revalidatePath).toHaveBeenCalledWith(
          '/periodic-testing',
          'layout',
        );
        expect(revalidateTag).not.toHaveBeenCalled();
      },
    );

    test('testNotes() revalidates the player progression page', () => {
      revalidate.testNotes('player-1');

      expect(revalidatePath).toHaveBeenCalledWith(
        '/periodic-testing/progression/player-1',
      );
    });

    test('matchStats() revalidates every page showing a box score', () => {
      revalidate.matchStats();

      expect(revalidatePath).toHaveBeenCalledWith('/matches');
      expect(revalidatePath).toHaveBeenCalledWith('/matches/stats');
      expect(revalidatePath).toHaveBeenCalledWith('/performance/[id]', 'page');
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    test('user() calls revalidatePath with the correct profile path', () => {
      revalidate.user(MOCK_USER.id);

      expect(revalidatePath).toHaveBeenCalledWith('/profile/' + MOCK_USER.id);
      expect(revalidateTag).not.toHaveBeenCalled();
    });
  });
});
