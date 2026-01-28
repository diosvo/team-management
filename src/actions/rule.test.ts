import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  getRule as getDbRule,
  insertRule as insertDbRule,
  updateRule as updateDbRule,
} from '@/db/rule';

import { mockWithAuth } from '@/test/mocks/auth';
import { MOCK_RULE } from '@/test/mocks/rule';
import { MOCK_TEAM } from '@/test/mocks/team';

import { getRule, upsertRule } from './rule';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
}));

vi.mock('@/db/rule', () => ({
  getRule: vi.fn(),
  insertRule: vi.fn(),
  updateRule: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: {
    rule: vi.fn(),
  },
}));

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

    test('returns null when rule does not exist', async () => {
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
    };
    const errorMessage = 'An error occurred';

    test('updates existing rule and revalidates cache', async () => {
      vi.mocked(getDbRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(updateDbRule).mockResolvedValue({
        ...mockResult,
        command: 'UPDATE',
      });

      const result = await upsertRule(newContent);

      expect(getDbRule).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(updateDbRule).toHaveBeenCalledWith(MOCK_RULE.rule_id, newContent);
      expect(insertDbRule).not.toHaveBeenCalled();
      expect(revalidate.rule).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated rule successfully',
      });
    });

    test('inserts new rule when rule does not exist', async () => {
      vi.mocked(getDbRule).mockResolvedValue(null);
      vi.mocked(insertDbRule).mockResolvedValue({
        ...mockResult,
        command: 'INSERT',
      });

      const result = await upsertRule(newContent);

      expect(getDbRule).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(insertDbRule).toHaveBeenCalledWith({
        team_id: MOCK_TEAM.team_id,
        content: newContent,
      });
      expect(updateDbRule).not.toHaveBeenCalled();
      expect(revalidate.rule).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added rule successfully',
      });
    });

    test('returns error response when update fails', async () => {
      vi.mocked(getDbRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(updateDbRule).mockRejectedValue(new Error(errorMessage));
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

    test('returns error response when insert fails', async () => {
      vi.mocked(getDbRule).mockResolvedValue(null);
      vi.mocked(insertDbRule).mockRejectedValue(new Error(errorMessage));
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

    test('handles database constraint errors', async () => {
      const pgError = 'Unique constraint violation';
      vi.mocked(getDbRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(updateDbRule).mockRejectedValue({
        code: '23505',
        detail: 'Duplicate key',
      });
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: pgError,
        constraint: 'unique_rule_team',
      });

      const result = await upsertRule(newContent);

      expect(result).toEqual({
        success: false,
        message: pgError,
      });
    });
  });
});
