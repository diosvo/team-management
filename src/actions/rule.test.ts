import { revalidate } from '@/actions/cache';
import { getDbErrorMessage } from '@/db/pg-error';
import { selectRule, updateRule } from '@/db/rule';
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
  selectRule: vi.fn(),
  updateRule: vi.fn(),
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

  test('upsertRule requires the edit action only', () => {
    expect(mockWithResourceAction).toHaveBeenCalledWith(
      ['edit'],
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
      vi.mocked(selectRule).mockResolvedValue(MOCK_RULE);

      const result = await getRule();

      expect(selectRule).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(result).toEqual(MOCK_RULE);
    });

    test('returns null when the team cannot be read', async () => {
      vi.mocked(selectRule).mockResolvedValue(null);

      const result = await getRule();
      expect(result).toBeNull();
    });

    test('propagates errors from getRule', async () => {
      const message = 'Database error';
      const error = new Error(message);
      vi.mocked(selectRule).mockRejectedValue(error);

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
      vi.mocked(selectRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(updateRule).mockResolvedValue(mockResult);

      const result = await upsertRule(newContent);

      expect(selectRule).toHaveBeenCalledWith(MOCK_TEAM.team_id);
      expect(updateRule).toHaveBeenCalledWith(MOCK_TEAM.team_id, newContent);
      expect(revalidate.rule).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Updated rule successfully',
      });
    });

    test('reports "Added" when the team had no rules written yet', async () => {
      vi.mocked(selectRule).mockResolvedValue({
        rule_content: null,
        rule_updated_at: null,
      });
      vi.mocked(updateRule).mockResolvedValue(mockResult);

      const result = await upsertRule(newContent);

      expect(updateRule).toHaveBeenCalledWith(MOCK_TEAM.team_id, newContent);
      expect(revalidate.rule).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Added rule successfully',
      });
    });

    test('returns error response when the write fails', async () => {
      vi.mocked(selectRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(updateRule).mockRejectedValue(new Error(errorMessage));
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
      vi.mocked(selectRule).mockRejectedValue(new Error(errorMessage));
      vi.mocked(getDbErrorMessage).mockReturnValue({
        message: errorMessage,
        constraint: null,
      });

      const result = await upsertRule(newContent);

      expect(updateRule).not.toHaveBeenCalled();
      expect(revalidate.rule).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: errorMessage,
      });
    });

    test('handles database constraint errors', async () => {
      const pgError = 'Check constraint violation';
      vi.mocked(selectRule).mockResolvedValue(MOCK_RULE);
      vi.mocked(updateRule).mockRejectedValue({
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
