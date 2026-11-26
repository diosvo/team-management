import { NO_EMAIL_DOMAIN } from '@/utils/constants';
import { AccountStatus } from '@/utils/enum';

import db from '@/drizzle';
import { mockDeleteSuccess, mockUpdateSuccess } from '@/test/db-operations';
import { MOCK_ACCOUNT } from '@/test/mocks/account';
import { MOCK_TEAM } from '@/test/mocks/team';

import {
  deletePasswordLinks,
  deleteSessions,
  hasRealEmail,
  isHistoryRecorded,
  isPasswordSet,
  selectAccounts,
  toAccountStatus,
  updateLastSignIn,
} from './account';

vi.mock('@/drizzle', () => ({
  default: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
    query: { AccountTable: { findFirst: vi.fn() } },
  },
}));

const NOW = new Date('2026-11-20T09:00:00Z');
const LATER = new Date('2026-11-20T10:00:00Z');
const EARLIER = new Date('2026-11-20T08:00:00Z');
const EMAIL = MOCK_ACCOUNT.email;

describe('hasRealEmail', () => {
  test('builds a filter without touching the database', () => {
    expect(hasRealEmail()).toBeDefined();
  });
});

describe('toAccountStatus', () => {
  test('is no_email for a placeholder, whatever else is set', () => {
    expect(
      toAccountStatus(
        {
          email: `x@${NO_EMAIL_DOMAIN}`,
          has_password: true,
          link_expires_at: LATER,
        },
        NOW,
      ),
    ).toBe(AccountStatus.NO_EMAIL);
  });

  test('is activated once a password exists, whatever the links say', () => {
    expect(
      toAccountStatus(
        { email: EMAIL, has_password: true, link_expires_at: LATER },
        NOW,
      ),
    ).toBe(AccountStatus.ACTIVATED);
  });

  test('is invited while a link is still valid', () => {
    expect(
      toAccountStatus(
        { email: EMAIL, has_password: false, link_expires_at: LATER },
        NOW,
      ),
    ).toBe(AccountStatus.INVITED);
  });

  test('is expired once every link has run out', () => {
    expect(
      toAccountStatus(
        { email: EMAIL, has_password: false, link_expires_at: EARLIER },
        NOW,
      ),
    ).toBe(AccountStatus.LINK_EXPIRED);
  });

  test('is expired when no link was ever sent', () => {
    expect(
      toAccountStatus(
        { email: EMAIL, has_password: false, link_expires_at: null },
        NOW,
      ),
    ).toBe(AccountStatus.LINK_EXPIRED);
  });

  test('defaults to the current time', () => {
    expect(
      toAccountStatus({
        email: EMAIL,
        has_password: false,
        link_expires_at: new Date(Date.now() + 60_000),
      }),
    ).toBe(AccountStatus.INVITED);
  });
});

/**
 * A query builder whose every step chains, `.as()` names a subquery, and
 * awaiting it settles to `rows`.
 */
function mockQueryChain(rows: () => Promise<unknown>) {
  const chain: Record<string, unknown> = {};
  for (const step of ['from', 'where', 'groupBy', 'leftJoin', 'orderBy']) {
    chain[step] = vi.fn(() => chain);
  }
  chain.as = vi.fn((alias: string) => ({
    user_id: `${alias}.user_id`,
    active: `${alias}.active`,
    expires_at: `${alias}.expires_at`,
  }));
  chain.then = (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (error: unknown) => unknown,
  ) => rows().then(onFulfilled, onRejected);

  vi.mocked(db.select).mockReturnValue(
    chain as unknown as ReturnType<typeof db.select>,
  );
  vi.mocked(db.selectDistinct).mockReturnValue(
    chain as unknown as ReturnType<typeof db.selectDistinct>,
  );
  return chain as Record<'where' | 'leftJoin' | 'orderBy', () => unknown>;
}

describe('selectAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('maps rows to accounts with a status and no password flag', async () => {
    const { status: _, ...row } = MOCK_ACCOUNT;
    const chain = mockQueryChain(() =>
      Promise.resolve([
        { ...row, has_password: true },
        {
          ...row,
          id: 'user-2',
          has_password: false,
          link_expires_at: new Date(Date.now() + 60_000),
        },
      ]),
    );

    const result = await selectAccounts(MOCK_TEAM.team_id);

    expect(chain.leftJoin).toHaveBeenCalledTimes(3);
    expect(chain.where).toHaveBeenCalled();
    expect(chain.orderBy).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(MOCK_ACCOUNT);
    expect(result[0]).not.toHaveProperty('has_password');
    expect(result[1]?.status).toBe(AccountStatus.INVITED);
  });

  test('returns an empty array when the query fails', async () => {
    mockQueryChain(() => Promise.reject(new Error('db down')));

    expect(await selectAccounts(MOCK_TEAM.team_id)).toEqual([]);
  });
});

describe('updateLastSignIn', () => {
  const AT = new Date('2026-11-20T09:00:00Z');

  test('saves when and from where the member signed in', async () => {
    const { mockSet, mockWhere } = mockUpdateSuccess({ rowCount: 1 });

    await updateLastSignIn('user-456', AT, '203.0.113.7');

    expect(mockSet).toHaveBeenCalledWith({
      last_sign_in_at: AT,
      last_sign_in_ip: '203.0.113.7',
    });
    expect(mockWhere).toHaveBeenCalled();
  });

  test.each([[''], [null], [undefined]])('stores no IP for %j', async (ip) => {
    const { mockSet } = mockUpdateSuccess({ rowCount: 1 });

    await updateLastSignIn('user-456', AT, ip);

    expect(mockSet).toHaveBeenCalledWith({
      last_sign_in_at: AT,
      last_sign_in_ip: null,
    });
  });
});

describe('deleteSessions', () => {
  test('deletes the sessions of the given user', async () => {
    const mockWhere = mockDeleteSuccess({ rowCount: 2 });

    const result = await deleteSessions('user-456');

    expect(db.delete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(result).toEqual({ rowCount: 2 });
  });
});

describe('deletePasswordLinks', () => {
  test('deletes the emailed password links of the given user', async () => {
    const mockWhere = mockDeleteSuccess({ rowCount: 1 });

    const result = await deletePasswordLinks('user-456');

    expect(mockWhere).toHaveBeenCalled();
    expect(result).toEqual({ rowCount: 1 });
  });
});

describe('isPasswordSet', () => {
  test.each([
    [{ id: 'account-1' }, true],
    [undefined, false],
  ])('finds %j → %s', async (row, expected) => {
    vi.mocked(db.query.AccountTable.findFirst).mockResolvedValue(row as never);

    expect(await isPasswordSet('user-456')).toBe(expected);
  });
});

describe('isHistoryRecorded', () => {
  test.each([
    [[{ has_history: true }], true],
    [[{ has_history: false }], false],
    [[], false],
  ])('reads %j → %s', async (rows, expected) => {
    vi.mocked(db.execute).mockResolvedValue({ rows } as never);

    expect(await isHistoryRecorded('user-456')).toBe(expected);
  });
});
