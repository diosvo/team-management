import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { type Team, TeamTable } from '@/drizzle/schema/team';

import { mockUpdateFailure, mockUpdateSuccess } from '@/test/db-operations';
import { MOCK_RULE } from '@/test/mocks/rule';
import { MOCK_TEAM } from '@/test/mocks/team';

import { getRule, upsertRule } from './rule';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      TeamTable: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/drizzle/schema/team', () => ({
  TeamTable: {
    team_id: 'team_id',
  },
}));

describe('getRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns the rule columns when the query succeeds', async () => {
    vi.mocked(db.query.TeamTable.findFirst).mockResolvedValue(
      // The query narrows to two columns; the mock's type does not.
      MOCK_RULE as Team,
    );

    const result = await getRule(MOCK_TEAM.team_id);

    expect(result).toEqual(MOCK_RULE);
    // Verify query construction: only the two rule columns are selected
    expect(db.query.TeamTable.findFirst).toHaveBeenCalledWith({
      columns: { rule_content: true, rule_updated_at: true },
      where: eq(TeamTable.team_id, MOCK_TEAM.team_id),
    });
  });

  test('returns null when the team does not exist', async () => {
    vi.mocked(db.query.TeamTable.findFirst).mockResolvedValue(undefined);

    const result = await getRule(MOCK_TEAM.team_id);
    expect(result).toBeNull();
  });

  test.each([
    {
      description: 'fails',
      mockError: new Error('Database error'),
    },
    {
      description: 'throws non-error exception',
      mockError: 'Unknown error',
    },
  ])('returns null when database query $description', async ({ mockError }) => {
    vi.mocked(db.query.TeamTable.findFirst).mockRejectedValue(mockError);

    const result = await getRule(MOCK_TEAM.team_id);
    expect(result).toBeNull();
  });
});

describe('upsertRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const newContent = 'Updated content';

  test('writes content and stamps its own revision time', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-08-30T10:00:00.000Z');
    vi.setSystemTime(now);

    const { mockWhere, mockSet } = mockUpdateSuccess({ rowCount: 1 });

    const result = await upsertRule(MOCK_TEAM.team_id, newContent);

    expect(result).toEqual({ rowCount: 1 });
    // Verify query construction
    expect(db.update).toHaveBeenCalledWith(TeamTable);
    expect(mockSet).toHaveBeenCalledWith({
      rule_content: newContent,
      rule_updated_at: now,
    });
    expect(eq).toHaveBeenCalledWith(TeamTable.team_id, MOCK_TEAM.team_id);
    expect(mockWhere).toHaveBeenCalledWith({
      field: TeamTable.team_id,
      value: MOCK_TEAM.team_id,
      type: 'eq',
    });

    vi.useRealTimers();
  });

  test('throws error when update fails', async () => {
    const message = 'Update failed';
    mockUpdateFailure(message);

    await expect(upsertRule(MOCK_TEAM.team_id, newContent)).rejects.toThrow(
      message,
    );
  });
});
