import db from '@/drizzle';
import { TeamTable } from '@/drizzle/schema/team';

import {
  selectJerseyOrderSheet,
  selectPaymentEditorEmails,
  spreadsheetUrl,
  updateJerseyOrderSheet,
} from './jersey-order';

vi.mock('@/drizzle', () => ({
  default: { select: vi.fn(), update: vi.fn() },
}));

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_xyzAB';

/** `select().from().where().limit()` resolving to `rows` (or rejecting). */
const mockSelect = (rows: unknown, fail = false) => {
  const limit = fail
    ? vi.fn().mockRejectedValue(new Error('db down'))
    : vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  vi.mocked(db.select).mockReturnValue({ from } as never);
  return { from, where, limit };
};

describe('spreadsheetUrl', () => {
  test('builds the edit link from the id', () => {
    expect(spreadsheetUrl('abc')).toBe(
      'https://docs.google.com/spreadsheets/d/abc/edit',
    );
  });
});

describe('selectJerseyOrderSheet', () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns this year's sheet as a link", async () => {
    const updated_at = new Date('2026-11-14T10:00:00');
    const { from } = mockSelect([{ spreadsheet_id: ID, updated_at }]);

    expect(await selectJerseyOrderSheet('team-1', 2026)).toEqual({
      url: spreadsheetUrl(ID),
      updated_at,
    });
    expect(from).toHaveBeenCalledWith(TeamTable);
  });

  test('ignores a sheet from an earlier year', async () => {
    mockSelect([
      { spreadsheet_id: ID, updated_at: new Date('2025-12-20T10:00:00') },
    ]);

    expect(await selectJerseyOrderSheet('team-1', 2026)).toBeNull();
  });

  test('returns null when the team has no sheet', async () => {
    mockSelect([{ spreadsheet_id: null, updated_at: null }]);

    expect(await selectJerseyOrderSheet('team-1', 2026)).toBeNull();
  });

  test('returns null when the query fails', async () => {
    mockSelect([], true);

    expect(await selectJerseyOrderSheet('team-1', 2026)).toBeNull();
  });
});

describe('updateJerseyOrderSheet', () => {
  test('stores the id with a fresh timestamp on the team', async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    vi.mocked(db.update).mockReturnValue({ set } as never);

    await updateJerseyOrderSheet('team-1', ID);

    expect(db.update).toHaveBeenCalledWith(TeamTable);
    expect(set).toHaveBeenCalledWith({
      uniform_order_spreadsheet_id: ID,
      uniform_order_updated_at: expect.any(Date),
    });
    expect(where).toHaveBeenCalled();
  });
});

describe('selectPaymentEditorEmails', () => {
  /** `select().from().leftJoin().where()` resolving to `rows`. */
  const mockJoin = (rows: unknown, fail = false) => {
    const where = fail
      ? vi.fn().mockRejectedValue(new Error('db down'))
      : vi.fn().mockResolvedValue(rows);
    const leftJoin = vi.fn(() => ({ where }));
    const from = vi.fn(() => ({ leftJoin }));
    vi.mocked(db.select).mockReturnValue({ from } as never);
    return { where };
  };

  test("lists the team's super admins and captains", async () => {
    const { where } = mockJoin([
      { email: 'admin@example.com' },
      { email: 'captain@example.com' },
    ]);

    expect(await selectPaymentEditorEmails('team-1')).toEqual([
      'admin@example.com',
      'captain@example.com',
    ]);
    expect(where).toHaveBeenCalled();
  });

  test('returns an empty list when the query fails', async () => {
    mockJoin([], true);

    expect(await selectPaymentEditorEmails('team-1')).toEqual([]);
  });
});
