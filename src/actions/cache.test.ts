import { revalidatePath, revalidateTag } from 'next/cache';

import { MOCK_USER } from '@/test/mocks/user';
import { CACHE_TAG } from '@/utils/constant';

import { revalidate } from './cache';

describe('revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.skip('Cached entities (revalidatePath + revalidateTag)', () => {
    test.each([
      ['assets', '/assets', CACHE_TAG.ASSETS],
      ['leagues', '/leagues', CACHE_TAG.LEAGUES],
      ['locations', '/locations', CACHE_TAG.LOCATIONS],
      ['rule', '/team-rule', CACHE_TAG.RULE],
    ] as const)('revalidate %s() correctly', (method, path, tag) => {
      revalidate[method]();

      expect(revalidatePath).toHaveBeenCalledWith(path);
      expect(revalidateTag).toHaveBeenCalledWith(tag, 'max');
    });
  });

  describe('Non-cached entities (revalidatePath only)', () => {
    test.each([
      ['assets', '/assets'],
      ['leagues', '/leagues'],
      ['locations', '/locations'],
      ['rule', '/team-rule'],
      ['attendances', '/attendance'],
      ['matches', '/matches'],
      ['roster', '/roster'],
      ['sessions', '/training'],
      ['testResults', '/periodic-testing'],
      ['testTypes', '/periodic-testing/test-types'],
    ] as const)('revalidate %s() correctly', (method, path) => {
      revalidate[method]();

      expect(revalidatePath).toHaveBeenCalledWith(path);
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    test('user() calls revalidatePath with the correct profile path', () => {
      revalidate.user(MOCK_USER.id);

      expect(revalidatePath).toHaveBeenCalledWith('/profile/' + MOCK_USER.id);
      expect(revalidateTag).not.toHaveBeenCalled();
    });
  });
});
