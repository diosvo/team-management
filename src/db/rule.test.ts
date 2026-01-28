import { cacheTag } from 'next/cache';

import { eq } from 'drizzle-orm';
import { vi } from 'vitest';

import { getCacheTag } from '@/actions/cache';
import db from '@/drizzle';
import { InsertRule, RuleTable } from '@/drizzle/schema/rule';

import { MOCK_RULE } from '@/test/mocks/rule';
import { MOCK_TEAM } from '@/test/mocks/team';

import { getRule, insertRule, updateRule } from './rule';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      RuleTable: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/drizzle/schema/rule', () => ({
  RuleTable: {
    team_id: 'team_id',
    rule_id: 'rule_id',
  },
}));

vi.mock('@/actions/cache', () => ({
  getCacheTag: {
    rule: vi.fn(() => 'rule'),
  },
}));

describe('getRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns rule when database query succeeds', async () => {
    vi.mocked(db.query.RuleTable.findFirst).mockResolvedValue(MOCK_RULE);

    const result = await getRule(MOCK_TEAM.team_id);

    expect(result).toEqual(MOCK_RULE);
    expect(cacheTag).toHaveBeenCalledWith('rule');
    expect(getCacheTag.rule).toHaveBeenCalled();
    // Verify query construction
    expect(eq).toHaveBeenCalledWith(RuleTable.team_id, MOCK_TEAM.team_id);
    expect(db.query.RuleTable.findFirst).toHaveBeenCalledWith({
      where: { field: RuleTable.team_id, value: MOCK_TEAM.team_id, type: 'eq' },
    });
  });

  test('returns null when database query fails', async () => {
    const error = new Error('Database error');
    vi.mocked(db.query.RuleTable.findFirst).mockRejectedValue(error);

    const result = await getRule(MOCK_TEAM.team_id);
    expect(result).toBeNull();
  });

  test('returns null when database query throws non-error exception', async () => {
    vi.mocked(db.query.RuleTable.findFirst).mockRejectedValue('Unknown error');

    const result = await getRule(MOCK_TEAM.team_id);
    expect(result).toBeNull();
  });
});

describe('insertRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInsertData: InsertRule = {
    team_id: MOCK_TEAM.team_id,
    content: 'New rule content',
  };

  test('inserts rule successfully', async () => {
    const mockValues = vi.fn().mockResolvedValue({ rule_id: 1 });
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as unknown as ReturnType<typeof db.insert>);

    const result = await insertRule(mockInsertData);

    expect(result).toEqual({ rule_id: 1 });
    // Verify query construction
    expect(db.insert).toHaveBeenCalledWith(RuleTable);
    expect(mockValues).toHaveBeenCalledWith(mockInsertData);
  });

  test('throws error when insert fails', async () => {
    const message = 'Insert failed';
    const error = new Error(message);

    const mockValues = vi.fn().mockRejectedValue(error);
    vi.mocked(db.insert).mockReturnValue({
      values: mockValues,
    } as unknown as ReturnType<typeof db.insert>);

    await expect(insertRule(mockInsertData)).rejects.toThrow(message);
  });
});

describe('updateRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const newContent = 'Updated content';

  test('updates rule successfully', async () => {
    const mockWhere = vi.fn().mockResolvedValue({ rule_id: 1 });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({
      set: mockSet,
    } as unknown as ReturnType<typeof db.update>);

    const result = await updateRule(MOCK_RULE.rule_id, newContent);

    expect(result).toEqual({ rule_id: 1 });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(RuleTable);
    expect(mockSet).toHaveBeenCalledWith({ content: newContent });
    expect(eq).toHaveBeenCalledWith(RuleTable.rule_id, MOCK_RULE.rule_id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: RuleTable.rule_id,
      value: MOCK_RULE.rule_id,
      type: 'eq',
    });
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    const error = new Error(message);

    const mockWhere = vi.fn().mockRejectedValue(error);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.update).mockReturnValue({
      set: mockSet,
    } as unknown as ReturnType<typeof db.update>);

    await expect(updateRule(MOCK_RULE.rule_id, newContent)).rejects.toThrow(
      message,
    );
  });
});
