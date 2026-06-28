import { and, eq, inArray, ne, or } from 'drizzle-orm';

import db from '@/drizzle';
import { PlayerTable, UserTable } from '@/drizzle/schema';

import { UserRole } from '@/utils/enum';

import { MOCK_TEAM } from '@/test/mocks/team';
import { MOCK_USER } from '@/test/mocks/user';

import { fetchDefaultRecipientEmails, fetchReportRecipients } from './report';

vi.mock('@/drizzle', () => ({
  default: {
    query: {
      UserTable: {
        findMany: vi.fn(),
      },
    },
    selectDistinct: vi.fn(),
  },
}));

vi.mock('@/drizzle/schema', () => ({
  UserTable: {
    id: 'id',
    name: 'name',
    email: 'email',
    role: 'role',
    team_id: 'team_id',
  },
  PlayerTable: {
    id: 'player_id',
    is_captain: 'is_captain',
  },
}));

const DEFAULT_REPORT_ROLES = [UserRole.COACH, UserRole.SUPER_ADMIN];

const MOCK_RECIPIENTS = [
  {
    ...MOCK_USER,
    id: 'user-1',
    email: 'coach@example.com',
    role: UserRole.COACH,
  },
  {
    ...MOCK_USER,
    id: 'user-2',
    email: 'player@example.com',
    role: UserRole.PLAYER,
  },
];

/** Builds the selectDistinct().from().leftJoin().where() chain used in report.ts */
function mockSelectDistinctSuccess(rows: Array<{ email: string }>) {
  const mockWhere = vi.fn().mockResolvedValue(rows);
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });

  vi.mocked(db.selectDistinct).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.selectDistinct>);

  return { mockFrom, mockLeftJoin, mockWhere };
}

function mockSelectDistinctFailure(error: unknown) {
  const mockWhere = vi.fn().mockRejectedValue(error);
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });

  vi.mocked(db.selectDistinct).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.selectDistinct>);

  return { mockFrom, mockLeftJoin, mockWhere };
}

describe('fetchReportRecipients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns recipients when database query succeeds', async () => {
    vi.mocked(db.query.UserTable.findMany).mockResolvedValue(MOCK_RECIPIENTS);

    const result = await fetchReportRecipients(MOCK_TEAM.team_id);

    expect(result).toEqual(MOCK_RECIPIENTS);
    // Verify query construction
    expect(db.query.UserTable.findMany).toHaveBeenCalledWith({
      where: and(
        eq(UserTable.team_id, MOCK_TEAM.team_id),
        ne(UserTable.role, UserRole.SUPER_ADMIN),
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  });

  test('returns empty array when database query fails', async () => {
    vi.mocked(db.query.UserTable.findMany).mockRejectedValue(
      new Error('Database error'),
    );

    const result = await fetchReportRecipients(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});

describe('fetchDefaultRecipientEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns distinct emails when database query succeeds', async () => {
    const rows = [
      { email: 'coach@example.com' },
      { email: 'captain@example.com' },
    ];
    const { mockFrom, mockLeftJoin, mockWhere } =
      mockSelectDistinctSuccess(rows);

    const result = await fetchDefaultRecipientEmails(MOCK_TEAM.team_id);

    expect(result).toEqual(['coach@example.com', 'captain@example.com']);
    // Verify query construction
    expect(db.selectDistinct).toHaveBeenCalledWith({ email: UserTable.email });
    expect(mockFrom).toHaveBeenCalledWith(UserTable);
    expect(mockLeftJoin).toHaveBeenCalledWith(
      PlayerTable,
      eq(PlayerTable.id, UserTable.id),
    );
    expect(mockWhere).toHaveBeenCalledWith(
      and(
        eq(UserTable.team_id, MOCK_TEAM.team_id),
        or(
          inArray(UserTable.role, DEFAULT_REPORT_ROLES),
          eq(PlayerTable.is_captain, true),
        ),
      ),
    );
  });

  test('returns empty array when no default recipients exist', async () => {
    mockSelectDistinctSuccess([]);

    const result = await fetchDefaultRecipientEmails(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });

  test('returns empty array when database query fails', async () => {
    mockSelectDistinctFailure(new Error('Database error'));

    const result = await fetchDefaultRecipientEmails(MOCK_TEAM.team_id);

    expect(result).toEqual([]);
  });
});
