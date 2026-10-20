import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import { getRule as getDbRule, upsertRule as saveDbRule } from '@/db/rule';

import {
  mockWithAuth,
  mockWithResource,
  mockWithResourceAction,
} from '@/test/mocks/auth';
import { MOCK_RULE } from '@/test/mocks/rule';
import { MOCK_TEAM } from '@/test/mocks/team';

import { getRule, upsertRule } from './rule';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/rule', () => ({
  getRule: vi.fn(),
  upsertRule: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    rule: vi.fn(),
  },
}));

describe('permissions', () => {
  test('scopes to the team-rule resource', () => {
    expect(mockWithResource).toHaveBeenCalledWith('team-rule');
  });

  test('upsertRule requires create and edit actions', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['create', 'edit'],
      expect.objectContaining({ name: 'upsert' }),
    );
  });
});

describe('Rule Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRule', () => {
    test('calls getRule with team_id through withAuth', async () => {
      vi.mocked(getDbRule).mockResolvedValue(MOCK_RULE);

      const result = await getRule();

      expect(getDbRule).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(MOCK_RULE);
    });

    test('returns null when the team cannot be read', async () => {
      vi.mocked(getDbRule).mockResolvedValue(null);

      const result = await getRule();
      expect(result).toBeNull();
    });

    test('propagates errors from getRule', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(getDbRule).mockRejectedValue(error);

      await expect(getRule()).rejects.toThrow(message);
    });
  });

  describe('upsertRule', () => {
    const newContent = 'Updated rule content';
    const mockResult = {
      rows: [],
      rowCount: 1,
      oid: 0,
      fields: [],
      command: 'UPDATE',
    };
    const errorMessage = 'An error occurred';

    test('writes the content onto the team and revalidates cache', async () => {
      vi.mocked(getDbRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(saveDbRule).mockResolvedValue(mockResult);

      const result = await upsertRule(newContent);

      expect(getDbRule).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(saveDbRule).toHaveBeenCalledWith(MOCK_TEAM.team_id, newContent);
      expect(revalidate.rule).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated rule successfully',
      });
    });

    test('reports "Added" when the team had no rules written yet', async () => {
      vi.mocked(getDbRule).mockResolvedValue({
        rule_content: null,
        rule_updated_at: null,
      });
      vi.mocked(saveDbRule).mockResolvedValue(mockResult);

      const result = await upsertRule(newContent);

      expect(saveDbRule).toHaveBeenCalledWith(MOCK_TEAM.team_id, newContent);
      expect(revalidate.rule).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added rule successfully',
      });
    });

    test('returns error response when the write fails', async () => {
      vi.mocked(getDbRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(saveDbRule).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertRule(newContent);

      expect(getDbErrorMessage).toHaveBeenCalled();
      expect(revalidate.rule).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('returns error response when the team lookup fails', async () => {
      vi.mocked(getDbRule).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertRule(newContent);

      expect(saveDbRule).not.toHaveBeenCalled();
      expect(revalidate.rule).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Check constraint violation';
      vi.mocked(getDbRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(saveDbRule).mockRejectedValue({
        code: '23514',
        detail: 'Violates check',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'default_team_not_external',
      });

      const result = await upsertRule(newContent);

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });
});
